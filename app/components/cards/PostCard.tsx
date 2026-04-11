import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FeedCategory, FeedQuest } from '../../constants/categories';
import { FEED_CATEGORY_BG, FEED_COLORS, FEED_PILL_BG } from '../../constants/colors';

// Local Avatars
import Avatar1 from "../../../assets/ProfileSetupPic/Sprite.svg";
import Avatar2 from "../../../assets/ProfileSetupPic/Sprite (1).svg";
import Avatar3 from "../../../assets/ProfileSetupPic/Sprite (2).svg";
import Avatar4 from "../../../assets/ProfileSetupPic/Sprite (3).svg";
import Avatar5 from "../../../assets/ProfileSetupPic/Sprite (4).svg";
import Avatar6 from "../../../assets/ProfileSetupPic/Selected_Avatar_Content.svg";

const avatarAssets = [
    Avatar1,
    Avatar2,
    Avatar3,
    Avatar4,
    Avatar5,
    Avatar6
];

type PostCardProps = {
	quest: FeedQuest;
	onPress?: () => void;
};

const CATEGORY_META: Record<FeedCategory, { label: string; color: string }> = {
	favor: { label: 'FAVOR', color: FEED_COLORS.favor },
	study: { label: 'STUDY', color: FEED_COLORS.study },
	item: { label: 'ITEM', color: FEED_COLORS.item },
};

export default function PostCard({ quest, onPress }: PostCardProps) {
	const categoryMeta = CATEGORY_META[quest.category];
	const categoryBg = FEED_CATEGORY_BG[quest.category];

	const PosterAvatar = quest.posterAvatarIndex !== undefined && quest.posterAvatarIndex !== null 
        ? avatarAssets[quest.posterAvatarIndex] 
        : avatarAssets[0];

	return (
		<Pressable style={styles.card} onPress={onPress}>
			<View style={[styles.stripe, { backgroundColor: categoryMeta.color }]} />

			<View style={styles.body}>
				<View style={styles.headerRow}>
					<View style={[styles.categoryBadge, { backgroundColor: categoryBg }]}>
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
						<PosterAvatar width={22} height={22} />
						<Text style={styles.posterName}>{quest.posterName}</Text>
					</View>

					<View style={styles.rewardWrap}>
						<View style={[styles.rewardPill, { backgroundColor: FEED_PILL_BG.xp }]}>
							<MaterialCommunityIcons name="star-four-points" size={14} color={FEED_COLORS.xp} />
							<Text style={[styles.rewardValue, { color: FEED_COLORS.xp }]}>{quest.xp}</Text>
						</View>

						<View style={[styles.rewardPill, { backgroundColor: FEED_PILL_BG.token }]}>
							<MaterialCommunityIcons name="lightning-bolt-circle" size={14} color={FEED_COLORS.token} />
							<Text style={[styles.rewardValue, { color: FEED_COLORS.token }]}>{quest.token}</Text>
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
		borderColor: FEED_COLORS.border,
		backgroundColor: FEED_COLORS.surface,
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
	},
	ago: {
		fontSize: 11,
		color: FEED_COLORS.textSecondary,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
		color: FEED_COLORS.textPrimary,
	},
	preview: {
		fontSize: 13,
		lineHeight: 19,
		color: FEED_COLORS.textSecondary,
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
	posterName: {
		fontSize: 12,
		color: FEED_COLORS.textSecondary,
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
	},
});