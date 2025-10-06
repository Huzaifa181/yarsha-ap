import {Images, ImagesDark} from '@/theme';
import {ImageSourcePropType} from 'react-native';

export type MultiMediaMenuItem = {
  id: number;
  key: string;
  title: string;
  icon: ImageSourcePropType;
  iconDark: ImageSourcePropType;
};

export const MultiMediaMenu: MultiMediaMenuItem[] = [
  {
    id: 1,
    key: 'photos',
    title: 'Photos',
    icon: Images.photosMultiMedia,
    iconDark: ImagesDark.photosMultiMedia,
  },
  {
    id: 2,
    key: 'documents',
    title: 'Documents',
    icon: Images.pdfMultiMedia,
    iconDark: ImagesDark.pdfMultiMedia,
  },
  {
    id: 3,
    key: 'blinks',
    title: 'Blinks',
    icon: Images.blinksMultimedia,
    iconDark: ImagesDark.blinksMultimedia,
  },
  {
    id: 4,
    key: 'gif',
    title: 'Gif',
    icon: Images.gifMultimedia,
    iconDark: ImagesDark.gifMultimedia,
  },
  {
    id: 5,
    key: 'camera',
    title: 'Camera',
    icon: Images.cameraMultimedia,
    iconDark: ImagesDark.cameraMultimedia,
  },
  {
    id: 6,
    key: 'videos',
    title: 'Videos',
    icon: Images.videoMultiMedia,
    iconDark: ImagesDark.videoMultiMedia,
  },
];
