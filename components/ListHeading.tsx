import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'

const LishHeading = ({ title, onViewAllPress, showAction = true}: ListHeadingProps  ) => {
  return (
    <View className='list-head'>
      <Text className='list-title'>{title}</Text>
      {showAction && (
      <TouchableOpacity className='list-action' onPress={onViewAllPress}>
        <Text className='list-action-text'>
          View All

        </Text>

      </TouchableOpacity>
      )}
    </View>
  )
}

export default LishHeading
