#!/bin/bash

# BVOTE Backend Log Rotation Script
# This script rotates and compresses log files to manage disk space

# Configuration
LOG_DIR="/var/www/bvote/backend/logs"
BACKUP_DIR="/var/www/bvote/backend/logs/archive"
RETENTION_DAYS=30
MAX_SIZE="100M"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Create directories if they don't exist
create_directories() {
    log "Creating directories..."
    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKUP_DIR"
}

# Rotate log files
rotate_logs() {
    log "Starting log rotation..."

    cd "$LOG_DIR" || exit 1

    for logfile in *.log; do
        if [ -f "$logfile" ]; then
            # Check file size
            size=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null)

            if [ "$size" -gt 104857600 ]; then  # 100MB in bytes
                log "Rotating $logfile (size: $(echo $size | awk '{print int($1/1024/1024)"MB"}')"

                # Create timestamped backup
                timestamp=$(date +'%Y%m%d_%H%M%S')
                backup_file="${BACKUP_DIR}/${logfile%.log}_${timestamp}.log"

                # Move current log to backup
                mv "$logfile" "$backup_file"

                # Compress backup
                gzip "$backup_file"

                # Create new empty log file
                touch "$logfile"
                chmod 644 "$logfile"

                log "Created backup: ${backup_file}.gz"
            fi
        fi
    done
}

# Clean old backups
clean_old_logs() {
    log "Cleaning logs older than $RETENTION_DAYS days..."

    find "$BACKUP_DIR" -name "*.log.gz" -mtime +$RETENTION_DAYS -type f -delete

    removed_count=$(find "$BACKUP_DIR" -name "*.log.gz" -mtime +$RETENTION_DAYS -type f | wc -l)
    log "Removed $removed_count old log files"
}

# Send notification if log directory is getting full
check_disk_space() {
    log "Checking disk space..."

    # Get disk usage percentage for log directory
    usage=$(df "$LOG_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')

    if [ "$usage" -gt 80 ]; then
        warn "Log directory disk usage is at ${usage}%"

        # Send alert (you can customize this)
        if command -v mail &> /dev/null; then
            echo "Log directory on $(hostname) is at ${usage}% capacity" | \
            mail -s "BVOTE Log Directory Alert" admin@yourdomain.com
        fi
    fi
}

# Generate log statistics
generate_stats() {
    log "Generating log statistics..."

    stats_file="$LOG_DIR/log_stats.json"

    cat > "$stats_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "log_files": [
$(for logfile in "$LOG_DIR"/*.log; do
    if [ -f "$logfile" ]; then
        size=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null)
        lines=$(wc -l < "$logfile")
        echo "    {"
        echo "      \"file\": \"$(basename "$logfile")\","
        echo "      \"size_bytes\": $size,"
        echo "      \"lines\": $lines,"
        echo "      \"last_modified\": \"$(stat -f%m "$logfile" 2>/dev/null || stat -c%Y "$logfile" 2>/dev/null)\""
        echo "    },"
    fi
done | sed '$ s/,$//')
  ],
  "total_files": $(ls -1 "$LOG_DIR"/*.log 2>/dev/null | wc -l),
  "total_size_bytes": $(du -sb "$LOG_DIR" 2>/dev/null | cut -f1),
  "archive_files": $(ls -1 "$BACKUP_DIR"/*.log.gz 2>/dev/null | wc -l),
  "archive_size_bytes": $(du -sb "$BACKUP_DIR" 2>/dev/null | cut -f1)
}
EOF

    log "Log statistics saved to $stats_file"
}

# Main execution
main() {
    log "Starting BVOTE log rotation"

    create_directories
    rotate_logs
    clean_old_logs
    check_disk_space
    generate_stats

    log "Log rotation completed successfully"
}

# Run main function
main "$@"
