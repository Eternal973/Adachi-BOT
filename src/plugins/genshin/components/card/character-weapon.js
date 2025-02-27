const template =
`<div class="character-weapon">
	<img class="icon" :src="weapon.icon" alt="ERROR"/>
	<div class="detail">
		<p class="w-name">{{ weapon.name }}</p>
		<p class="level">Lv.{{ weapon.level }}</p>
		<p class="refine">精炼.{{ weapon.affixLevel }}</p>
	</div>
</div>`;

const { defineComponent } = Vue;

export default defineComponent( {
	name: "CharacterWeapon",
	template,
	props: {
		weapon: Object
	}
} );