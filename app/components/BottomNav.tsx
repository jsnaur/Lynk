import { Asset } from 'expo-asset';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { FEED_COLORS } from '../constants/colors';

type BottomNavProps = {
	activeTab?: 'Feed' | 'Quests' | 'Post' | 'Shop' | 'Profile';
	onTabPress?: (tab: NonNullable<BottomNavProps['activeTab']>) => void;
};

type NavItem = {
	label: BottomNavProps['activeTab'];
};

const NAV_ITEMS: NavItem[] = [
	{ label: 'Feed' },
	{ label: 'Quests' },
	{ label: 'Post' },
	{ label: 'Shop' },
	{ label: 'Profile' },
];

const NAV_ICON_URIS = {
	Feed: {
		active: Asset.fromModule(require('../../assets/NavAssets/FeedActive.svg')).uri,
		inactive: Asset.fromModule(require('../../assets/NavAssets/FeedInactive.svg')).uri,
	},
	Quests: {
		active: Asset.fromModule(require('../../assets/NavAssets/QuestActive.svg')).uri,
		inactive: Asset.fromModule(require('../../assets/NavAssets/QuestInactive.svg')).uri,
	},
	Post: {
		active: Asset.fromModule(require('../../assets/NavAssets/PostActive.svg')).uri,
		inactive: Asset.fromModule(require('../../assets/NavAssets/PostInactive.svg')).uri,
	},
	Shop: {
		active: Asset.fromModule(require('../../assets/NavAssets/ShopActive.svg')).uri,
		inactive: Asset.fromModule(require('../../assets/NavAssets/ShopInactive.svg')).uri,
	},
	Profile: {
		active: Asset.fromModule(require('../../assets/NavAssets/ProfileActive.svg')).uri,
		inactive: Asset.fromModule(require('../../assets/NavAssets/ProfileInactive.svg')).uri,
	},
} as const;

export default function BottomNav({ activeTab = 'Feed', onTabPress }: BottomNavProps) {
	const [selectedTab, setSelectedTab] = useState<NonNullable<BottomNavProps['activeTab']>>(activeTab);

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
					const tab = item.label as NonNullable<BottomNavProps['activeTab']>;
					const active = selectedTab === tab;
					const iconUri = active ? NAV_ICON_URIS[tab].active : NAV_ICON_URIS[tab].inactive;

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
								<SvgUri uri={iconUri} width={56} height={56} />
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
