import {View, Text, Image, Pressable} from 'react-native'
import React from 'react'
import {formatCurrency, formatStatusLabel, formatSubscriptionDateTime} from "@/libs/utils";
import { clsx } from "clsx";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const SubscriptionCard = ({ name, price, currency, icon, iconGlyph, billing, color, category, plan, renewalDate, expanded, onPress, onLongPress, paymentMethod, startDate, status}: SubscriptionCardProps) => {
    const paymentMethodLabel = paymentMethod?.trim() || 'Not provided';
    const categoryLabel = category?.trim() || plan?.trim() || 'Not provided';
    const startDateLabel = startDate ? formatSubscriptionDateTime(startDate) : 'Not provided';
    const renewalDateLabel = renewalDate ? formatSubscriptionDateTime(renewalDate) : 'Not provided';
    const statusLabel = status ? formatStatusLabel(status) : 'Not provided';
    const vectorIconName = iconGlyph as MaterialIconName | undefined;

    return (
        <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={350} className={clsx('sub-card', expanded ? 'sub-card-expanded' : 'bg-card')} style={!expanded && color ? { backgroundColor: color } : undefined}>
            <View className="sub-head">
                <View className="sub-main">
                    {vectorIconName ? (
                        <View className="sub-icon items-center justify-center bg-background/80">
                            <MaterialCommunityIcons name={vectorIconName} size={34} color={colors.primary} />
                        </View>
                    ) : (
                        <Image source={icon} className="sub-icon" />
                    )}
                    <View className="sub-copy">
                        <Text numberOfLines={1} className="sub-title">
                            {name}
                        </Text>
                        <Text numberOfLines={1} ellipsizeMode="tail" className="sub-meta">
                            {category?.trim() || plan?.trim() || (renewalDate ? formatSubscriptionDateTime(renewalDate) : '')}
                        </Text>
                    </View>
                </View>

                <View className="sub-price-box">
                    <Text className="sub-price">{formatCurrency(price, currency)}</Text>
                    <Text className="sub-billing">{billing}</Text>
                </View>
            </View>

            {expanded && (
                <View className="sub-bdy">
                    <View className="sub-details">
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Payment:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">{paymentMethodLabel}</Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Category:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">{categoryLabel}</Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Started:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">{startDateLabel}</Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Renewal date:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">{renewalDateLabel}</Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Status:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">{statusLabel}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </Pressable>
    )
}
export default SubscriptionCard
