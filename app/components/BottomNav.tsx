import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

// 1. Import SVGs directly as React Components instead of using require()
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

type BottomNavProps = {
	activeTab?: MainTab;
	onTabPress?: (tab: MainTab) => void;
};

export type MainTab = 'Feed' | 'Quests' | 'Post' | 'Shop' | 'Profile';

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

// 2. Map the imported components
const NAV_ICONS = {
	Feed: { active: FeedActive, inactive: FeedInactive },
	Quests: { active: QuestActive, inactive: QuestInactive },
	Post: { active: PostActive, inactive: PostInactive },
	Shop: { active: ShopActive, inactive: ShopInactive },
	Profile: { active: ProfileActive, inactive: ProfileInactive },
} as const;

export default function BottomNav({ activeTab = 'Feed', onTabPress }: BottomNavProps) {
	const [selectedTab, setSelectedTab] = useState<MainTab>(activeTab);

	useEffect(() => {
		setSelectedTab(activeTab);
	}, [activeTab]);

	return (
		<View style={styles.wrapper}>
			<BlurView
				intensity={25}
				tint="dark"
				experimentalBlurMethod="dimezisBlurView"
				style={styles.blurLayer}
			/>
			<View pointerEvents="none" style={styles.tintLayer} />
			<View style={styles.row}>
				{NAV_ITEMS.map((item) => {
					const tab = item.label;
					const active = selectedTab === tab;
                    
                    // 3. Select the correct component based on active state
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
							<View style={[styles.iconBox, active && styles.iconBoxActive]}>
                                {/* 4. Render it directly as a component */}
								<IconComponent width={56} height={56} />
							</View>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		minHeight: 84,
		overflow: 'hidden',
		backgroundColor: 'rgba(22,24,30,0.1)',
		borderTopWidth: 1,
		borderTopColor: 'rgba(255,255,255,0.34)',
	},
	blurLayer: {
		...StyleSheet.absoluteFillObject,
	},
	tintLayer: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(22,24,30,0.08)',
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
	iconBoxActive: {
		backgroundColor: 'rgba(0,245,255,0.15)',
	},
});