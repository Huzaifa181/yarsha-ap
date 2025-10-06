import React, {
    createContext,
    PropsWithChildren,
    useEffect,
    useMemo,
    useState,
} from 'react';
import i18next from 'i18next';
import { LanguageSpace } from '@/types';

export const LanguageContext = createContext<
    LanguageSpace.LanguageContextType | undefined
>(undefined);

const LanguageProvider = ({ children, storage }: LanguageSpace.Props) => {
    const [language, setLanguage] = useState(
        storage.getString('language') || 'en',
    );

    useEffect(() => {
        if (!storage.contains('language')) {
            storage.set('language', 'en');
            setLanguage('en');
            i18next.changeLanguage('en');
        } else {
            i18next.changeLanguage(language);
        }
    }, []);

    const changeLanguage = (lang: string) => {
        setLanguage(lang);
        storage.set('language', lang);
        i18next.changeLanguage(lang);
    };

    const value = useMemo(() => {
        return { language, changeLanguage };
    }, [language]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export default LanguageProvider;
