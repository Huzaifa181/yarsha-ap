import React, { forwardRef } from 'react';
import { TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

interface IProps extends TouchableOpacityProps {
    children: React.ReactNode;
    activeOpacity?: number
}

/**
 * @author Nitesh Raj Khanal
 * @function @ButtonVariant
 **/

const ButtonVariant = forwardRef<View, IProps>(({ children, activeOpacity, ...props }, ref) => {
    return (
        <TouchableOpacity ref={ref} {...props} activeOpacity={activeOpacity || 0.5}>
            {children}
        </TouchableOpacity>
    );
});

export default React.memo(ButtonVariant);
