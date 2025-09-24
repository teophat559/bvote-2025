import { useCallback } from "react";
import { useToast } from "../components/ui/use-toast";

export const useNotificationSound = () => {
  const { toast } = useToast();

  // Định nghĩa 3 kiểu chuông khác nhau
  const bellTypes = {
    classic: "/sounds/bell-classic.mp3",
    chime: "/sounds/bell-chime.mp3",
    alert: "/sounds/bell-alert.mp3",
    default: "/sounds/notification.mp3",
  };

  const playNotificationSound = useCallback(
    (volume = 0.7, bellType = "default") => {
      try {
        const soundPath = bellTypes[bellType] || bellTypes.default;
        const audio = new Audio(soundPath);
        audio.volume = volume;

        // Set timeout để tránh bị treo
        const playPromise = audio.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log(`🔔 Âm thanh ${bellType} đã phát thành công!`);
            })
            .catch((error) => {
              console.error("Lỗi phát âm thanh thông báo:", error);
              // Fallback: sử dụng system beep
              try {
                // Tạo beep sound bằng Web Audio API
                const audioContext = new (window.AudioContext ||
                  window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 880; // Hz
                gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(
                  0.001,
                  audioContext.currentTime + 0.5
                );

                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.5);

                console.log("🔔 Đã sử dụng Web Audio API fallback!");
              } catch (webAudioError) {
                console.error("Lỗi Web Audio API:", webAudioError);
                // Final fallback: hiển thị toast
                toast({
                  title: "🔔 Thông báo",
                  description: `Có thông báo mới (${bellType})!`,
                  duration: 2000,
                });
              }
            });
        }
      } catch (error) {
        console.error("Lỗi tạo audio object:", error);
        toast({
          title: "🔔 Thông báo",
          description: "Có thông báo mới!",
          duration: 2000,
        });
      }
    },
    [toast]
  );

  const testNotificationSound = useCallback(
    (volume = 0.7, bellType = "default") => {
      try {
        const soundPath = bellTypes[bellType] || bellTypes.default;
        const audio = new Audio(soundPath);
        audio.volume = volume;

        const playPromise = audio.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              toast({
                title: "✅ Test thành công",
                description: `Âm thanh chuông ${bellType} đã phát thành công!`,
                duration: 2000,
              });
            })
            .catch((error) => {
              console.error("Lỗi test âm thanh:", error);
              // Fallback: sử dụng Web Audio API
              try {
                const audioContext = new (window.AudioContext ||
                  window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                // Tần số khác nhau cho từng loại chuông
                const frequencies = {
                  classic: 880,
                  chime: 660,
                  alert: 1100,
                  default: 880,
                };

                oscillator.frequency.value = frequencies[bellType] || 880;
                gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(
                  0.001,
                  audioContext.currentTime + 0.5
                );

                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.5);

                toast({
                  title: "✅ Test thành công (Web Audio)",
                  description: `Âm thanh chuông ${bellType} đã phát bằng Web Audio API!`,
                  duration: 2000,
                });
              } catch (webAudioError) {
                console.error("Lỗi Web Audio API:", webAudioError);
                toast({
                  title: "❌ Test thất bại",
                  description: `Không thể phát âm thanh chuông ${bellType}!`,
                  variant: "destructive",
                  duration: 3000,
                });
              }
            });
        }
      } catch (error) {
        console.error("Lỗi tạo audio object:", error);
        toast({
          title: "❌ Test thất bại",
          description: "Không thể tạo audio object!",
          variant: "destructive",
          duration: 3000,
        });
      }
    },
    [toast]
  );

  return {
    playNotificationSound,
    testNotificationSound,
  };
};
