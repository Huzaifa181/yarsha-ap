import { PropsWithChildren } from 'react';
import type { MMKV } from 'react-native-mmkv';

export namespace LanguageSpace {
    export type LanguageContextType = {
        language: string;
        changeLanguage: (lang: string) => void;
    };

    export type Props = PropsWithChildren<{
        storage: MMKV;
    }>;
}
