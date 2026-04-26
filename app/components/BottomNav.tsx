import { BlurView } from 'expo-blur';
import { useEffect, useState, useMemo } from 'react';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import FeedActive from '../../assets/NavAssets/FeedActive.svg';
import FeedInactive from '../../assets/NavAssets/FeedInactive.svg';
import QuestActive from '../../assets/NavAssets/QuestActive.svg';
import QuestInactive from '../../assets/NavAssets/QuestInactive.svg';
import PostActive from '../../assets/NavAssets/PostActive.svg';
import PostInactive from '../../assets/NavAssets/PostInactive.svg';
import ShopActive from '../../assets/NavAssets/ShopActive.svg';
import ShopInactive from '../../assets/NavAssets/ShopInactive.svg';
import ProfileActive from '../../assets/NavAssets/ProfileActive.svg';
import ProfileInactive from '../../assets/NavAssets/ProfileInactive.svg';

import { useTheme } from '../contexts/ThemeContext';
import { withOpacity } from '../constants/colors';

export type MainTab = 'Feed' | 'Quests' | 'Post' | 'Shop' | 'Profile';

type BottomNavProps = {
	activeTab?: MainTab;
	onTabPress?: (tab: MainTab) => void;
};

type NavItem = {
	label: MainTab;
};

const NAV_ITEMS: NavItem[] = [
	{ label: 'Feed' },
	{ label: 'Quests' },
	{ label: 'Post' },
	{ label: 'Shop' },
	{ label: 'Profile' },
];

const NAV_ICONS = {
	Feed: { active: FeedActive, inactive: FeedInactive },
	Quests: { active: QuestActive, inactive: QuestInactive },
	Post: { active: PostActive, inactive: PostInactive },
	Shop: { active: ShopActive, inactive: ShopInactive },
	Profile: { active: ProfileActive, inactive: ProfileInactive },
} as const;

export default function BottomNav({ activeTab = 'Feed', onTabPress }: BottomNavProps) {
	const [selectedTab, setSelectedTab] = useState<MainTab>(activeTab);
	const isFocused = useIsFocused();
	
	const { theme, colors } = useTheme();
	const styles = useMemo(() => getStyles(theme, colors), [theme, colors]);

	useEffect(() => {
		setSelectedTab(activeTab);
	}, [activeTab]);

	return (
		<View style={styles.wrapper} collapsable={false}>
			{/* CRITICAL FIX: Only render dimezisBlurView when the screen is focused.
				When navigating to Settings, we swap it to a solid translucent background 
				to prevent Android's rendering engine from crashing and causing white screens.
				iOS handles background blur natively without crashing, so it stays active.
			*/}
			{isFocused || Platform.OS === 'ios' ? (
				<BlurView
					intensity={theme === 'dark' ? 25 : 60}
					tint={theme === 'dark' ? "dark" : "light"}
					style={styles.blurLayer}
					experimentalBlurMethod="dimezisBlurView"
				/>
			) : (
				<View style={[styles.blurLayer, { backgroundColor: theme === 'dark' ? 'rgba(22,24,30,0.85)' : 'rgba(255,255,255,0.9)' }]} />
			)}
			
			<View pointerEvents="none" style={styles.tintLayer} />
			<View style={styles.row}>
				{NAV_ITEMS.map((item) => {
					const tab = item.label;
					const active = selectedTab === tab;
					const IconComponent = active ? NAV_ICONS[tab].active : NAV_ICONS[tab].inactive;

					return (
						<Pressable
							key={item.label}
							style={styles.item}
							onPress={() => {
								setSelectedTab(tab);
								onTabPress?.(tab);
							}}
						>
							<View style={[styles.iconBox, active && { backgroundColor: withOpacity(colors.favor, 0.15) }]}>
								<IconComponent width={56} height={56} />
							</View>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const getStyles = (theme: string, colors: any) => StyleSheet.create({
	wrapper: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		minHeight: 84,
		overflow: 'hidden',
		backgroundColor: theme === 'dark' ? 'rgba(22,24,30,0.1)' : 'rgba(255,255,255,0.4)',
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	blurLayer: {
		...StyleSheet.absoluteFillObject,
	},
	tintLayer: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: theme === 'dark' ? 'rgba(22,24,30,0.08)' : 'rgba(255,255,255,0.2)',
	},
	row: {
		height: 58,
		paddingHorizontal: 16,
		paddingTop: 4,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	item: {
		width: 62,
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconBox: {
		width: 52,
		height: 52,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
});