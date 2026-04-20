import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FeedCategory, FeedQuest } from '../../constants/categories';
import { COLORS, withOpacity } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { ACCESSORY_ITEMS, ALL_SLOTS_Z_ORDER, AvatarSlot } from '../../constants/accessories';

type PostCardProps = {
	quest: FeedQuest;
	onPress?: () => void;
};

const CATEGORY_META: Record<FeedCategory, { label: string; color: string }> = {
	favor: { label: 'FAVOR', color: COLORS.favor },
	study: { label: 'STUDY', color: COLORS.study },
	item: { label: 'ITEM', color: COLORS.item },
};

function getAccessoryById(accessoryId?: string | null) {
	if (!accessoryId) return undefined;
	return ACCESSORY_ITEMS.find((item) => item?.id === accessoryId);
}

// Generate a random avatar with a consistent seed for a given ID
function generateRandomAccessories(seed: string): Partial<Record<AvatarSlot, string>> {
	// Create a simple hash from the seed to get pseudo-random but consistent results
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		const char = seed.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	const rng = () => {
		hash = (hash * 9301 + 49297) % 233280;
		return hash / 233280;
	};

	const accessories: Partial<Record<AvatarSlot, string>> = {};

	// Pick a random body
	const bodies = ACCESSORY_ITEMS.filter((item): item is (typeof ACCESSORY_ITEMS)[number] => Boolean(item) && item.slot === 'Body');
	if (bodies.length > 0) {
		accessories['Body'] = bodies[Math.floor(rng() * bodies.length)].id;
	}

	// Determine gender from body if available
	const bodyItem = getAccessoryById(accessories['Body']);
	const gender = bodyItem?.gender || (rng() > 0.5 ? 'Masc' : 'Fem');

	// Pick matching gender items for clothing and hair
	const getRandomBySlot = (slot: AvatarSlot) => {
		const matching = ACCESSORY_ITEMS.filter(
			(item): item is (typeof ACCESSORY_ITEMS)[number] => Boolean(item) && item.slot === slot && (item.gender === gender || item.gender === 'Shared')
		);
		return matching.length > 0 ? matching[Math.floor(rng() * matching.length)].id : undefined;
	};

	// Add essential items
	accessories['HairBase'] = getRandomBySlot('HairBase') || undefined;
	accessories['HairFringe'] = getRandomBySlot('HairFringe') || undefined;
	accessories['Eyes'] = getRandomBySlot('Eyes') || undefined;
	accessories['Mouth'] = getRandomBySlot('Mouth') || undefined;
	accessories['Top'] = getRandomBySlot('Top') || undefined;
	accessories['Bottom'] = getRandomBySlot('Bottom') || undefined;

	// Optionally add some accessories
	if (rng() > 0.6) {
		accessories['Background'] = getRandomBySlot('Background') || undefined;
	}
	if (rng() > 0.5) {
		accessories['Headgear'] = getRandomBySlot('Headgear') || undefined;
	}

	return accessories;
}

export default function PostCard({ quest, onPress }: PostCardProps) {
	const categoryMeta = CATEGORY_META[quest.category];
	
	// Use provided accessories or generate random ones
	const posterAccessories = quest.posterAccessories && Object.keys(quest.posterAccessories).length > 0
		? quest.posterAccessories
		: generateRandomAccessories(quest.posterName || 'anon');

	return (
		<Pressable style={styles.card} onPress={onPress}>
			<View style={[styles.stripe, { backgroundColor: categoryMeta.color }]} />

			<View style={styles.body}>
				<View style={styles.headerRow}>
					<View style={[styles.categoryBadge, { backgroundColor: withOpacity(categoryMeta.color, 0.15) }]}>
						<View style={[styles.categoryDot, { backgroundColor: categoryMeta.color }]} />
						<Text style={[styles.categoryLabel, { color: categoryMeta.color }]}>
							{categoryMeta.label}
						</Text>
					</View>
					<Text style={styles.ago}>{quest.ago}</Text>
				</View>

				<Text style={styles.title}>{quest.title}</Text>
				<Text numberOfLines={2} style={styles.preview}>
					{quest.preview}
				</Text>

				<View style={styles.footerRow}>
					<View style={styles.posterWrap}>
						<View style={styles.avatarContainer}>
							{ALL_SLOTS_Z_ORDER.map(slot => {
								const accId = posterAccessories[slot];
								if (!accId) return null;
								const item = getAccessoryById(accId);
								if (!item) return null;
								const Sprite = item.Sprite;
								return (
									<View key={slot} style={styles.avatarLayer} pointerEvents="none">
										<Sprite width="100%" height="100%" />
									</View>
								);
							})}
						</View>
						<Text style={styles.posterName}>{quest.posterName}</Text>
					</View>

					<View style={styles.rewardWrap}>
						<View style={[styles.rewardPill, { backgroundColor: withOpacity(COLORS.xp, 0.15) }]}>
							<MaterialCommunityIcons name="star-four-points" size={14} color={COLORS.xp} />
							<Text style={[styles.rewardValue, { color: COLORS.xp }]}>{quest.xp}</Text>
						</View>

						<View style={[styles.rewardPill, { backgroundColor: withOpacity(COLORS.token, 0.15) }]}>
							<MaterialCommunityIcons name="lightning-bolt-circle" size={14} color={COLORS.token} />
							<Text style={[styles.rewardValue, { color: COLORS.token }]}>{quest.token}</Text>
						</View>
					</View>
				</View>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: {
		width: '100%',
		borderRadius: 16,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.surface,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.35,
		shadowRadius: 12,
		elevation: 6,
	},
	stripe: {
		height: 4,
		width: '100%',
	},
	body: {
		paddingHorizontal: 16,
		paddingTop: 14,
		paddingBottom: 12,
		gap: 8,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	categoryBadge: {
		borderRadius: 6,
		paddingVertical: 4,
		paddingHorizontal: 8,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	categoryDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	categoryLabel: {
		fontSize: 11,
		fontWeight: '500',
		fontFamily: FONTS.body,
	},
	ago: {
		fontSize: 11,
		color: COLORS.textSecondary,
		fontFamily: FONTS.body,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
		color: COLORS.textPrimary,
		fontFamily: FONTS.body,
	},
	preview: {
		fontSize: 13,
		lineHeight: 19,
		color: COLORS.textSecondary,
		fontFamily: FONTS.body,
	},
	footerRow: {
		marginTop: 8,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	posterWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	avatarContainer: {
		width: 24,
		height: 24,
		position: 'relative',
		overflow: 'hidden',
		borderRadius: 12,
		backgroundColor: COLORS.surface2,
	},
	avatarLayer: {
		...StyleSheet.absoluteFillObject,
		transform: [{ scale: 1.3 }, { translateY: 2 }],
	},
	posterName: {
		fontSize: 12,
		color: COLORS.textSecondary,
		fontFamily: FONTS.body,
	},
	rewardWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	rewardPill: {
		borderRadius: 10,
		paddingHorizontal: 7,
		paddingVertical: 3,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3,
	},
	rewardValue: {
		fontSize: 11,
		fontWeight: '700',
		fontFamily: FONTS.body,
	},
});