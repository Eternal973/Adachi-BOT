import { InputParameter } from "@modules/command";
import { WishResult, WishTotalSet } from "../module/wish";
import { wishClass } from "../init";
import { render } from "../utils/render";

type WishStatistic = WishResult & {
	count: number;
};

export async function main(
	{ sendMessage, messageData, redis }: InputParameter
): Promise<void> {
	const userID: number = messageData.user_id;
	const nickname: string = messageData.sender.nickname;
	const param: string = messageData.raw_message;
	
	let choice: string | null = await redis.getString( `silvery-star.wish-choice-${ userID }` );
	if ( choice === null ) {
		choice = "角色"
		await redis.setString( `silvery-star.wish-choice-${ userID }`, "角色" );
		await redis.setHash( `silvery-star.wish-indefinite-${ userID }`, { five: 1, four: 1 } );
		await redis.setHash( `silvery-star.wish-character-${ userID }`, { five: 1, four: 1, isUp: 0 } );
		await redis.setHash( `silvery-star.wish-weapon-${ userID }`, { five: 1, four: 1, isUp: 0, epit: 0 } );
	}
	
	const data: WishTotalSet | null = await wishClass.get( userID, choice, param );
	if ( data === null ) {
		await sendMessage( `${ choice }卡池暂未开放，请在游戏内卡池开放后再尝试` );
		return;
	}
	
	/* 单次十连 */
	if ( data.total === 10 ) {
		await redis.setString( `silvery-star.wish-result-${ userID }`, JSON.stringify( {
			type: choice,
			data: data.result,
			name: nickname
		} ) );
		await sendMessage( await render( "wish", { qq: userID } ) );
		return;
	}
	
	/* 统计抽取的数量 */
	const compressed: WishStatistic[] = data.result
		.filter( el => el.rank >= 4 )
		.reduce( ( pre, cur ) => {
			const find: number = pre.findIndex( el => el.name === cur.name );
			if ( find === -1 ) {
				return [ ...pre, { ...cur, count: 1 } ];
			}
			pre[find].count++;
			return pre;
		}, <WishStatistic[]>[] );
	
	const getSet: ( type: string ) => WishStatistic[] = type => {
		return compressed
			.filter( el => el.type === type )
			.sort( ( x, y ) => {
				return x.rank === y.rank ? y.count - x.count : y.rank - x.rank;
			} );
	};
	
	const charSet = getSet( "角色" );
	const weaponSet = getSet( "武器" );
	
	await redis.setHash( `silvery-star.wish-statistic-${ userID }`, {
		character: JSON.stringify( charSet ),
		weapon: JSON.stringify( weaponSet ),
		total: data.total
	} );
	const image: string = await render( "wish-statistic", { qq: userID } );
	await sendMessage( image );
}