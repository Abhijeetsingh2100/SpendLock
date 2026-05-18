import { useClerk, useUser } from '@clerk/expo'
import { useRouter } from 'expo-router'
import React from 'react'
import { Alert, Image, Pressable, Text, View } from 'react-native'
import { SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import images from '@/constants/images';

 const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const displayName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'SpendLock';
  const emailAddress = user?.primaryEmailAddress?.emailAddress || 'Signed in';
  const avatarSource = user?.imageUrl ? { uri: user.imageUrl } : images.avatar;

  const handleSignOut = () => {
    Alert.alert(
      'Sign out?',
      'You can sign back in anytime to keep testing the flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/sign-in');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className='flex-1 bg-background p-5'>
      <View className='mb-8'>
        <Text className='text-3xl font-sans-extrabold text-primary'>Settings</Text>
        <Text className='mt-2 text-base font-sans-medium text-muted-foreground'>
          Manage your account and app preferences.
        </Text>
      </View>

      <View className='rounded-3xl border border-border bg-card p-5'>
        <View className='flex-row items-center gap-4'>
          <Image source={avatarSource} className='size-16 rounded-full' />
          <View className='min-w-0 flex-1'>
            <Text numberOfLines={1} className='text-xl font-sans-bold text-primary'>
              {displayName}
            </Text>
            <Text numberOfLines={1} className='mt-1 text-sm font-sans-medium text-muted-foreground'>
              {emailAddress}
            </Text>
          </View>
        </View>
      </View>

      <Pressable className='mt-6 items-center rounded-2xl bg-primary py-4' onPress={handleSignOut}>
        <Text className='text-base font-sans-bold text-background'>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  )
}

export default Settings
