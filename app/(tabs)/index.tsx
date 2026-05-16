import { Text, View } from "react-native";
import "@/global.css";
import { Link, Redirect } from "expo-router";
import { SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";

 const SafeAreaView = styled(RNSafeAreaView);
export default function App() {
  
  return (
    <SafeAreaView
    className="flex-1 bg-background p-5"
    >


    <View className="flex-1  bg-background">
      <Text className="text-7xl font-sans-extrabold ">
        Home 
      </Text>
      
      <Link href="/onboaring" className="mt-4 font-sans-bold rounded-full bg-primary text-white p-4">Go to Onboarding Screen</Link>
      <Link href="/(auth)/sign-in" className="mt-4 font-sans-bold rounded-full bg-primary text-white p-4">Go to Sign In</Link>
      <Link href="/(auth)/sign-up" className="mt-4 font-sans-bold rounded-full bg-primary text-white p-4">Go to Sign Up</Link>
      
    </View>
    </SafeAreaView>
  );
}