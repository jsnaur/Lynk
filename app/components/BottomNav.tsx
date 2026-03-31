import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FEED_COLORS } from '../constants/colors';

type BottomNavProps = {
	activeTab?: 'Feed' | 'Quests' | 'Post' | 'Shop' | 'Profile';
};

type NavItem = {
	label: BottomNavProps['activeTab'];
	icon: keyof typeof Ionicons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
	{ label: 'Feed', icon: 'newspaper-outline' },
	{ label: 'Quests', icon: 'map-outline' },
	{ label: 'Post', icon: 'leaf-outline' },
	{ label: 'Shop', icon: 'pricetag-outline' },
	{ label: 'Profile', icon: 'person-outline' },
];

export default function BottomNav({ activeTab = 'Feed' }: BottomNavProps) {
	return (
		<View style={styles.wrapper}>
			<View style={styles.row}>
				{NAV_ITEMS.map((item) => {
					const active = activeTab === item.label;

					return (
						<Pressable key={item.label} style={styles.item}>
							<View style={[styles.iconBox, active && styles.iconBoxActive]}>
								<Ionicons
									name={item.icon}
									size={24}
									color={active ? FEED_COLORS.favor : FEED_COLORS.textSecondary}
								/>
							</View>
							<Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
								{item.label}
							</Text>
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
		backgroundColor: 'rgba(38,38,46,0.52)',
		borderTopWidth: 1,
		borderTopColor: FEED_COLORS.border,
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
		width: 54,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 2,
	},
	iconBox: {
		width: 40,
		height: 40,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconBoxActive: {
		backgroundColor: 'rgba(0,245,255,0.15)',
	},
	itemLabel: {
		fontSize: 10,
		color: FEED_COLORS.textSecondary,
		fontWeight: '500',
	},
	itemLabelActive: {
		color: FEED_COLORS.favor,
	},
});
