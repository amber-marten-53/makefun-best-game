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
        id: 'ricochet',
        icon: '🔄',
        title: 'Ricochet Matrix',
        desc: 'Shots bounce toward a nearby enemy upon impact.',
        apply: (player) => { player.ricochetCount = (player.ricochetCount || 0) + 1; }
      },
      {
        id: 'crit',
        icon: '🎯',
        title: 'Critical Targeting',
        desc: '+15% Critical Hit Chance for double damage.',
        apply: (player) => { player.critChance = (player.critChance || 0) + 0.15; }
      },
      {
        id: 'lifesteal',
        icon: '🩸',
        title: 'Nanite Lifesteal',
        desc: 'Restores a small amount of health on defeating enemies.',
        apply: (player) => { player.lifesteal = (player.lifesteal || 0) + 0.05; }
      },
      {
        id: 'orbital',
        icon: '🪐',
        title: 'Orbital Blade Drone',
        desc: 'Deploys a spinning energy blade that damages enemies on contact.',
        apply: (player) => { player.hasOrbitalBlade = true; player.orbitalCount = (player.orbitalCount || 0) + 1; }
      },
      {
        id: 'thorns',
        icon: '🌵',
        title: 'Reactive Thorns',
        desc: 'Damages attackers when they collide with your ship.',
        apply: (player) => { player.thornsDamage = (player.thornsDamage || 0) + 15; }
      },
      {
        id: 'overclock',
        icon: '🔥',
        title: 'Core Overclock',
        desc: '+35% Fire rate boost, but slight weapon spread.',
        apply: (player) => { player.fireRateMult += 0.35; player.spread = (player.spread || 0) + 0.05; }
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
