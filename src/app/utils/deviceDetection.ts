interface DeviceInfo {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "browser" | "other";
  location: string;
  lastActive: string;
  isCurrent: boolean;
  userAgent: string;
}

// Получение информации о браузере и ОС
export function getDeviceInfo(): { browser: string; os: string; type: "desktop" | "mobile" | "browser" | "other" } {
  const ua = navigator.userAgent;
  
  // Определение браузера
  let browser = "Unknown Browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
  
  // Определение ОС
  let os = "Unknown OS";
  if (ua.includes("Windows NT 10.0")) os = "Windows 10/11";
  else if (ua.includes("Windows NT 6.3")) os = "Windows 8.1";
  else if (ua.includes("Windows NT 6.2")) os = "Windows 8";
  else if (ua.includes("Windows NT 6.1")) os = "Windows 7";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  
  // Определение типа устройства
  let type: "desktop" | "mobile" | "browser" | "other" = "browser";
  if (ua.includes("Windows") || ua.includes("Mac OS X") || ua.includes("Linux")) {
    type = "desktop";
  } else if (ua.includes("Android") || ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) {
    type = "mobile";
  }
  
  return { browser, os, type };
}

// Получение геолокации (упрощенная версия)
export async function getLocation(): Promise<string> {
  try {
    // Пробуем получить через бесплатный IP API
    const response = await fetch('https://ipapi.co/json/', {
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      const city = data.city || 'Unknown City';
      const country = data.country_name || data.country || 'Unknown Country';
      return `${city}, ${country}`;
    }
  } catch (error) {
    console.warn('Failed to fetch location from ipapi.co:', error);
  }
  
  // Попытка получить базовую информацию о временной зоне
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone.replace('_', ' '); 
  } catch (error) {
    console.warn('Failed to get timezone:', error);
  }
  
  // Финальный фоллбэк
  return "Location unavailable";
}

// Создание уникального ID для устройства
export function generateDeviceId(): string {
  return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Получение текущей сессии устройства
export async function getCurrentDeviceSession(): Promise<DeviceInfo> {
  const { browser, os, type } = getDeviceInfo();
  const location = await getLocation();
  const deviceName = `${browser} on ${os}`;
  
  // Проверяем, есть ли уже ID текущего устройства в localStorage
  let deviceId = localStorage.getItem('connecta-device-id');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('connecta-device-id', deviceId);
  }
  
  return {
    id: deviceId,
    name: deviceName,
    type,
    location,
    lastActive: "Just now",
    isCurrent: true,
    userAgent: navigator.userAgent
  };
}

// Загрузка всех сохраненных устройств
export function loadStoredDevices(): DeviceInfo[] {
  const stored = localStorage.getItem('connecta-devices');
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Сохранение устройств
export function saveDevices(devices: DeviceInfo[]): void {
  localStorage.setItem('connecta-devices', JSON.stringify(devices));
}

// Обновление или добавление текущего устройства
export async function updateCurrentDevice(existingDevices: DeviceInfo[]): Promise<DeviceInfo[]> {
  const currentDevice = await getCurrentDeviceSession();
  const currentDeviceId = localStorage.getItem('connecta-device-id');
  
  // Удаляем старую версию текущего устройства, если она есть
  const otherDevices = existingDevices.filter(d => d.id !== currentDeviceId);
  
  // Обновляем статус isCurrent для всех устройств
  const updatedDevices = [
    { ...currentDevice, isCurrent: true },
    ...otherDevices.map(d => ({ ...d, isCurrent: false }))
  ];
  
  return updatedDevices;
}

// Форматирование времени с момента последней активности
export function getTimeAgo(lastActiveStr: string): string {
  if (lastActiveStr === "Just now") return lastActiveStr;
  
  try {
    // Если это ISO строка, парсим её
    let lastActive: Date;
    if (lastActiveStr.includes('T') && lastActiveStr.includes('Z')) {
      lastActive = new Date(lastActiveStr);
    } else {
      // Иначе пробуем парсить как обычную дату
      lastActive = new Date(lastActiveStr);
    }
    
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMs < 60000) return "Just now"; // Less than 1 minute
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    // For older dates, show the actual date
    return lastActive.toLocaleDateString();
  } catch (error) {
    console.warn('Error parsing date:', lastActiveStr, error);
    return lastActiveStr;
  }
}
