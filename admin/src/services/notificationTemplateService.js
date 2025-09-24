
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'notification_templates';

const initialTemplates = [
  { id: uuidv4(), name: 'Chào mừng thành viên mới', subject: 'Chào mừng bạn đến với hệ thống!', body: 'Xin chào [USERNAME], cảm ơn bạn đã tham gia! Chúng tôi rất vui được chào đón bạn.' },
  { id: uuidv4(), name: 'Cảnh báo đăng nhập đáng ngờ', subject: 'Cảnh báo bảo mật', body: 'Chúng tôi phát hiện một lần đăng nhập từ IP: [IP_ADDRESS]. Nếu không phải bạn, vui lòng bảo mật tài khoản ngay lập tức.' },
  { id: uuidv4(), name: 'Thông báo bảo trì hệ thống', subject: 'Thông báo bảo trì', body: 'Hệ thống sẽ được bảo trì vào lúc 3 giờ sáng ngày mai. Vui lòng lưu lại công việc của bạn.' },
];

const getTemplates = async () => {
  return new Promise((resolve) => {
    try {
      const templatesJson = localStorage.getItem(STORAGE_KEY);
      if (templatesJson) {
        resolve(JSON.parse(templatesJson));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTemplates));
        resolve(initialTemplates);
      }
    } catch (error) {
      console.error("Failed to fetch templates from localStorage", error);
      resolve(initialTemplates);
    }
  });
};

const addTemplate = async (template) => {
  return new Promise(async (resolve) => {
    const templates = await getTemplates();
    const newTemplate = { ...template, id: uuidv4() };
    const updatedTemplates = [newTemplate, ...templates];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));
    resolve(newTemplate);
  });
};

const updateTemplate = async (updatedTemplate) => {
  return new Promise(async (resolve) => {
    let templates = await getTemplates();
    templates = templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    resolve(updatedTemplate);
  });
};

const deleteTemplate = async (templateId) => {
  return new Promise(async (resolve) => {
    let templates = await getTemplates();
    templates = templates.filter(t => t.id !== templateId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    resolve(templateId);
  });
};

export const notificationTemplateService = {
  getTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
};
