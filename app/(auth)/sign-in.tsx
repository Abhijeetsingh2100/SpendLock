import { View, Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

const SignIn = () => {
  return (
    <SafeAreaView>

    <View>
      <Text>SignIn</Text>
      <Link href="/(auth)/sign-up" className="mt-4 rounded-full bg-primary text-white p-4">Create Accrount</Link>
    </View>
    </SafeAreaView>
  )
}

export default SignIn