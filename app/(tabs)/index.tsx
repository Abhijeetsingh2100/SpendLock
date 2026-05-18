import { useUser } from "@clerk/expo";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import "@/global.css";
import { SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import images from "@/constants/images"
import { HOME_BALANCE, UPCOMING_SUBSCRIPTIONS } from "@/constants/data";
import { icons } from "@/constants/icons";
import { formatCurrency } from "@/libs/utils";
import dayjs from "dayjs";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import { useState } from "react";
import { usePostHog } from "posthog-react-native";
import CreateSubscriptionModal from "@/src/components/CreateSubscriptionModal";
import { useSubscriptions } from "@/src/context/SubscriptionsContext";

 const SafeAreaView = styled(RNSafeAreaView);
export default function App() {

    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const { subscriptions, addSubscription } = useSubscriptions();
    const { user } = useUser();
    const posthog = usePostHog();
    const displayName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || "SpendLock";
    const avatarSource = user?.imageUrl ? { uri: user.imageUrl } : images.avatar;

    const handleCreateSubscription = (subscription: Subscription) => {
      addSubscription(subscription);
      posthog.capture('subscription_created', {
        subscription_id: subscription.id,
        subscription_name: subscription.name,
        category: subscription.category ?? 'Other',
        billing: subscription.billing,
      });
    };

  return (
    <SafeAreaView
    className="flex-1 bg-background p-5"
    >
      
      
    
     <FlatList  data={subscriptions} 
     ListHeaderComponent={()=>( 
      <>
      <View className="home-header">
       <View className="home-user">
        <Image source={avatarSource} className="home-avatar"/>
        <Text numberOfLines={1} className="home-user-name">{displayName}</Text>
       </View>

        <Pressable onPress={() => setIsCreateModalVisible(true)}>
          <Image source={icons.add} className="home-add-icon"/>
        </Pressable>
      </View>
      <View className="home-balance-card">
        <Text className="home-balance-label">
        Balance
        </Text>
        <View className="home-balance-row">
          <Text className="home-balance-amount">
            {formatCurrency(HOME_BALANCE.amount)}

          </Text>
          <Text className="home-balance-date ">

          {dayjs(HOME_BALANCE.nextRenewalDate).format('MM/DD')}
          </Text>
        </View>
        

      </View>
      <View  className="mb-5">
     <ListHeading title="Upcoming" />
     {/* <UpcomingSubscriptionCard data={UPCOMING_SUBSCRIPTIONS[0]}/> */}

     <FlatList 
     data={UPCOMING_SUBSCRIPTIONS} 
     renderItem={({item} ) => (
      <UpcomingSubscriptionCard {...item}/>
     )}
     keyExtractor={(item) => item.id}
     horizontal
     showsHorizontalScrollIndicator={false}
     ListEmptyComponent={<Text className="home-empty-state">No upcoming renewals</Text>}
     />

     
      </View>
       <ListHeading title="All Subscriptions" />
      </>
     )}
     keyExtractor={(item) => item.id}
     renderItem={({item}) => (
      <SubscriptionCard 
      {...item} expanded={expandedSubscriptionId === item.id}
      onPress={() => setExpandedSubscriptionId((currentId) => {
        const next = currentId === item.id ? null : item.id
        if (next !== null) {
          posthog.capture('subscription_card_expanded', { subscription_id: item.id, subscription_name: item.name })
        } else {
          posthog.capture('subscription_card_collapsed', { subscription_id: item.id, subscription_name: item.name })
        }
        return next
      })}
      />
     )}
     extraData={{ expandedSubscriptionId, subscriptions }} 
     ItemSeparatorComponent={()=> <View className="h-4"/>}
     showsVerticalScrollIndicator={false}
     ListEmptyComponent={<Text className="home-empty-state"> No subscriptions yet</Text>}
     contentContainerClassName="pb-30"
     />
     <CreateSubscriptionModal
      visible={isCreateModalVisible}
      onClose={() => setIsCreateModalVisible(false)}
      onCreate={handleCreateSubscription}
     />
     
      

     
     

    
    </SafeAreaView>
  );
}
