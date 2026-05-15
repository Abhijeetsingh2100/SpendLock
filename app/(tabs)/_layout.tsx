import { Tabs } from "expo-router";
import { tabs } from "@/constants/data";
import { View } from "react-native";
import clsx from "clsx"
import {colors} from '@/constants/theme'
import { Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { components } from "@/constants/theme";

const tabBar = components.tabBar;


export default function TabLayout() {
    const insets = useSafeAreaInsets();

    const TabIcon = ({focused,icon}: TabIconProps)=>{
        return(
        <View className="tabs-icon">
                <View className={clsx('tabs-pill', focused && 'tabs-active')}>
                <Image source={icon}  className="tabs-glyph" />

                

                </View>
        </View>
        );
    };
  return (
    <Tabs screenOptions={{ 
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle:{
            position: 'absolute',
            bottom: Math.max(insets.bottom,
                tabBar.horizontalInset

            ),
            height: tabBar.height,
            marginHorizontal: tabBar.horizontalInset,
            borderRadius: tabBar.radius,
            backgroundColor: colors.primary,
            borderTopWidth: 0,
            elevation: 0,
        },
        tabBarItemStyle:{
            paddingVertical: tabBar.height/2 - tabBar.iconFrame/1.6
        },
        tabBarIconStyle:{
            width: tabBar.iconFrame,
            height: tabBar.iconFrame,
            alignItems:'center'
        }
         }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon:({focused}) =>(
                <TabIcon focused={focused} icon={tab.icon}/>
            )
          }}
        />
      ))}
      
    </Tabs>
  );
}