import { TextVariant } from '@/components/atoms'
import React, { FC } from 'react'

interface IProps { }

/**
* @author
* @function @RecentGroups
**/


const RecentGroups: FC<IProps> = (props) => {

    return (
        <TextVariant>hello from groups</TextVariant>
    )
}

export default React.memo(RecentGroups)