export type FeedCategory = 'favor' | 'study' | 'item';

export type FeedQuest = {
	id: string;
	category: FeedCategory;
	title: string;
	preview: string;
	posterName: string;
	ago: string;
	xp: number;
	token: number;
};

export const FEED_FILTERS: Array<{ key: FeedCategory; label: string }> = [
	{ key: 'favor', label: 'Favor' },
	{ key: 'study', label: 'Study' },
	{ key: 'item', label: 'Item' },
];

export const FEED_QUESTS: FeedQuest[] = [
	{
		id: 'q1',
		category: 'favor',
		title: 'Quest Title',
		preview:
			'Quest preview text, lorem ipsum dolor sit amet. Consectetur adisciping eliti met. Sancti est con...',
		posterName: 'Poster Name',
		ago: '23m ago',
		xp: 30,
		token: 67,
	},
	{
		id: 'q2',
		category: 'study',
		title: 'Quest Title',
		preview:
			'Quest preview text, lorem ipsum dolor sit amet. Consectetur adisciping eliti met. Sancti est con...',
		posterName: 'Poster Name',
		ago: '23m ago',
		xp: 30,
		token: 67,
	},
	{
		id: 'q3',
		category: 'item',
		title: 'Quest Title',
		preview:
			'Quest preview text, lorem ipsum dolor sit amet. Consectetur adisciping eliti met. Sancti est con...',
		posterName: 'Poster Name',
		ago: '23m ago',
		xp: 30,
		token: 67,
	},
	{
		id: 'q4',
		category: 'favor',
		title: 'Quest Title',
		preview:
			'Quest preview text, lorem ipsum dolor sit amet. Consectetur adisciping eliti met. Sancti est con...',
		posterName: 'Poster Name',
		ago: '23m ago',
		xp: 30,
		token: 67,
	},
];
