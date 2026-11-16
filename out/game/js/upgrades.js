// Upgrade cards and rogue-lite stats system
export class UpgradeSystem {
  constructor() {
    this.allUpgrades = [
      {
        id: 'damage',
        icon: '💥',
        title: 'Plasma Amplification',
        desc: '+25% Weapon Damage & Shot Impact.',
        apply: (player) => { player.damageMult += 0.25; }
      },
      {
        id: 'fire_rate',
        icon: '⚡',
        title: 'Overclocked Relays',
        desc: '+20% Fire Rate & Faster Cycling.',
        apply: (player) => { player.fireRateMult += 0.20; }
      },
      {
        id: 'speed',
        icon: '🚀',
        title: 'Ion Thrusters',
        desc: '+15% Movement Speed & Agility.',
        apply: (player) => { player.speedMult += 0.15; }
      },
      {
        id: 'multishot',
        icon: '✨',
        title: 'Splitter Array',
        desc: '+1 Additional Projectile per Shot.',
        apply: (player) => { player.projectilesCount += 1; }
      },
      {
        id: 'piercing',
        icon: '🗡️',
        title: 'Armor-Piercing Rounds',
        desc: 'Projectiles pierce through +1 enemy.',
        apply: (player) => { player.pierceCount += 1; }
      },
      {
        id: 'magnet',
        icon: '🧲',
        title: 'Graviton Attractor',
        desc: '+50% XP Shard Collection Radius.',
        apply: (player) => { player.magnetRadius += 60; }
      },
      {
        id: 'shield',
        icon: '🛡️',
        title: 'Energy Deflector',
        desc: 'Restores full shield & +25 Max Shield.',
        apply: (player) => {
          player.maxShield += 25;
          player.shield = player.maxShield;
        }
      },
      {
        id: 'hp',
        icon: '❤️',
        title: 'Nanite Hull Plating',
        desc: 'Restores HP & +30 Max HP.',
        apply: (player) => {
          player.maxHp += 30;
          player.hp = Math.min(player.maxHp, player.hp + 50);
        }
      }
    ];
  }

  getRandomUpgrades(count = 3) {
    const shuffled = [...this.allUpgrades].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
