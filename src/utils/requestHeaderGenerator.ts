import DeviceInfo from 'react-native-device-info';
import type {TRequestHeader} from '@/hooks/domain/request/schema';

export const generateRequestHeader = async (): Promise<TRequestHeader> => {
  const RequestId = await generateUniqueId();
  const Timestamp = new Date().toISOString();
  const DeviceId = await DeviceInfo.getUniqueId();
  const DeviceModel = DeviceInfo.getModel();

  return {DeviceId, DeviceModel, RequestId, Timestamp};
};

const generateUniqueId = async (): Promise<string> => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `YARSHA-${timestamp}-${random}`;
};
