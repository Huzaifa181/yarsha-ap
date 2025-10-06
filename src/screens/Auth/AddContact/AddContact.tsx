import { SafeScreen } from '@/components/template'
import React, { FC } from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface IProps { }

/**
* @author Nitesh Raj Khanal
* @function @AddContact
* @returns JSX.Element
**/


const AddContact: FC<IProps> = (props) => {
    return (
        <SafeScreen></SafeScreen>
    )
}

export default React.memo(AddContact)