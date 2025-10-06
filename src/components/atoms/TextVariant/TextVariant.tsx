import React, { FC } from 'react';
import { Text, TextProps } from 'react-native';

interface IProps extends TextProps {
	children: React.ReactNode;
}

/**
 * @author Nitesh Raj Khanal
 * @function @TextVariant
 **/

const TextVariant: FC<IProps> = ({ children, ...props }) => {
	return (
		<Text adjustsFontSizeToFit={false} {...props}>
			{children}
		</Text>
	);
};

export default TextVariant;
