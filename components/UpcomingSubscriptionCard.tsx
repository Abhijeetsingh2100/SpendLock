import { View, Text, Image } from 'react-native'
import React from 'react'
import { formatCurrency } from '@/libs/utils'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '@/constants/theme'

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const UpcomingSubscriptionCard = ( {name, price, daysLeft, icon, iconGlyph, currency}: UpcomingSubscription) => {
  const vectorIconName = iconGlyph as MaterialIconName | undefined;

  return (
    <View className='upcoming-card'>
      <View className='upcoming-row'>
        {vectorIconName ? (
          <View className="upcoming-icon items-center justify-center rounded-lg bg-card">
            <MaterialCommunityIcons name={vectorIconName} size={28} color={colors.primary} />
          </View>
        ) : (
          <Image source={icon} className='upcoming-icon' />
        )}
        <View className="upcoming-copy">
            <Text className='upcoming-price' numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
              {formatCurrency(price, currency)}
            </Text>
            <Text className='upcoming-meta' numberOfLines={1}>
                {daysLeft > 1 ? `${daysLeft} days left` : daysLeft === 1 ? 'tomorrow' : 'today'}
            </Text>
        </View>
      </View>
      <Text className='upcoming-name' numberOfLines={1}>
        {name}
      </Text>
    </View>
  )
}

export default UpcomingSubscriptionCard
