import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface Building {
  id: string;
  type: 'headquarters' | 'barracks' | 'mine' | 'lumbermill' | 'quarry';
  level: number;
  x: number;
  y: number;
}

interface Resources {
  gold: number;
  wood: number;
  stone: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unlocked: boolean;
  reward: string;
}

const buildingCosts = {
  headquarters: { gold: 0, wood: 0, stone: 0 },
  barracks: { gold: 100, wood: 50, stone: 30 },
  mine: { gold: 80, wood: 40, stone: 20 },
  lumbermill: { gold: 60, wood: 30, stone: 40 },
  quarry: { gold: 70, wood: 35, stone: 25 },
};

const buildingNames = {
  headquarters: 'Штаб',
  barracks: 'Казармы',
  mine: 'Золотая шахта',
  lumbermill: 'Лесопилка',
  quarry: 'Каменоломня',
};

const buildingIcons = {
  headquarters: 'Castle',
  barracks: 'Swords',
  mine: 'Coins',
  lumbermill: 'Trees',
  quarry: 'Mountain',
};

const StrategyGame = () => {
  const [buildings, setBuildings] = useState<Building[]>([
    { id: '1', type: 'headquarters', level: 1, x: 2, y: 2 },
  ]);
  
  const [resources, setResources] = useState<Resources>({
    gold: 200,
    wood: 150,
    stone: 100,
  });

  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first_building',
      title: 'Первый строитель',
      description: 'Постройте первое здание',
      progress: 0,
      target: 1,
      unlocked: false,
      reward: '+50 золота',
    },
    {
      id: 'resource_master',
      title: 'Мастер ресурсов',
      description: 'Постройте по одному зданию каждого типа',
      progress: 0,
      target: 4,
      unlocked: false,
      reward: '+100 всех ресурсов',
    },
    {
      id: 'wealthy',
      title: 'Богач',
      description: 'Накопите 500 золота',
      progress: 0,
      target: 500,
      unlocked: false,
      reward: 'Скидка 10% на постройки',
    },
    {
      id: 'empire',
      title: 'Империя',
      description: 'Постройте 10 зданий',
      progress: 0,
      target: 10,
      unlocked: false,
      reward: '+2 к производству всех ресурсов',
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setResources((prev) => {
        const goldProduction = buildings.filter((b) => b.type === 'mine').length * 5;
        const woodProduction = buildings.filter((b) => b.type === 'lumbermill').length * 5;
        const stoneProduction = buildings.filter((b) => b.type === 'quarry').length * 5;

        return {
          gold: prev.gold + goldProduction,
          wood: prev.wood + woodProduction,
          stone: prev.stone + stoneProduction,
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [buildings]);

  useEffect(() => {
    checkAchievements();
  }, [buildings, resources]);

  const checkAchievements = () => {
    setAchievements((prev) =>
      prev.map((achievement) => {
        if (achievement.unlocked) return achievement;

        let newProgress = achievement.progress;
        let shouldUnlock = false;

        if (achievement.id === 'first_building') {
          newProgress = buildings.length - 1;
          shouldUnlock = newProgress >= achievement.target;
        } else if (achievement.id === 'resource_master') {
          const types = new Set(buildings.map((b) => b.type));
          types.delete('headquarters');
          newProgress = types.size;
          shouldUnlock = newProgress >= achievement.target;
        } else if (achievement.id === 'wealthy') {
          newProgress = resources.gold;
          shouldUnlock = newProgress >= achievement.target;
        } else if (achievement.id === 'empire') {
          newProgress = buildings.length;
          shouldUnlock = newProgress >= achievement.target;
        }

        if (shouldUnlock && !achievement.unlocked) {
          toast({
            title: '🏆 Достижение получено!',
            description: `${achievement.title}: ${achievement.reward}`,
          });
          applyReward(achievement.id);
        }

        return {
          ...achievement,
          progress: Math.min(newProgress, achievement.target),
          unlocked: shouldUnlock || achievement.unlocked,
        };
      })
    );
  };

  const applyReward = (achievementId: string) => {
    if (achievementId === 'first_building') {
      setResources((prev) => ({ ...prev, gold: prev.gold + 50 }));
    } else if (achievementId === 'resource_master') {
      setResources((prev) => ({
        gold: prev.gold + 100,
        wood: prev.wood + 100,
        stone: prev.stone + 100,
      }));
    }
  };

  const canAfford = (type: keyof typeof buildingCosts) => {
    const cost = buildingCosts[type];
    return (
      resources.gold >= cost.gold &&
      resources.wood >= cost.wood &&
      resources.stone >= cost.stone
    );
  };

  const buildBuilding = (type: keyof typeof buildingCosts) => {
    if (!canAfford(type)) {
      toast({
        title: 'Недостаточно ресурсов',
        description: 'Накопите больше ресурсов для постройки',
        variant: 'destructive',
      });
      return;
    }

    const cost = buildingCosts[type];
    setResources((prev) => ({
      gold: prev.gold - cost.gold,
      wood: prev.wood - cost.wood,
      stone: prev.stone - cost.stone,
    }));

    let x, y;
    do {
      x = Math.floor(Math.random() * 5);
      y = Math.floor(Math.random() * 5);
    } while (buildings.some((b) => b.x === x && b.y === y));

    const newBuilding: Building = {
      id: Date.now().toString(),
      type,
      level: 1,
      x,
      y,
    };

    setBuildings((prev) => [...prev, newBuilding]);
    toast({
      title: '✅ Здание построено',
      description: `${buildingNames[type]} успешно возведено`,
    });
  };

  const upgradeBuilding = (buildingId: string) => {
    const building = buildings.find((b) => b.id === buildingId);
    if (!building) return;

    const upgradeCost = {
      gold: 50 * building.level,
      wood: 30 * building.level,
      stone: 20 * building.level,
    };

    if (
      resources.gold >= upgradeCost.gold &&
      resources.wood >= upgradeCost.wood &&
      resources.stone >= upgradeCost.stone
    ) {
      setResources((prev) => ({
        gold: prev.gold - upgradeCost.gold,
        wood: prev.wood - upgradeCost.wood,
        stone: prev.stone - upgradeCost.stone,
      }));

      setBuildings((prev) =>
        prev.map((b) => (b.id === buildingId ? { ...b, level: b.level + 1 } : b))
      );

      toast({
        title: '⬆️ Улучшение завершено',
        description: `${buildingNames[building.type]} улучшено до уровня ${building.level + 1}`,
      });
    } else {
      toast({
        title: 'Недостаточно ресурсов',
        description: 'Требуется больше ресурсов для улучшения',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Стратегия: Империя
          </h1>
          <p className="text-slate-400 text-lg">Развивайте свою базу и получайте достижения</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-slate-800/50 border-yellow-500/30 p-4">
            <div className="flex items-center gap-3">
              <Icon name="Coins" className="text-yellow-500" size={32} />
              <div>
                <p className="text-slate-400 text-sm">Золото</p>
                <p className="text-2xl font-bold">{resources.gold}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-green-500/30 p-4">
            <div className="flex items-center gap-3">
              <Icon name="Trees" className="text-green-500" size={32} />
              <div>
                <p className="text-slate-400 text-sm">Древесина</p>
                <p className="text-2xl font-bold">{resources.wood}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-stone-500/30 p-4">
            <div className="flex items-center gap-3">
              <Icon name="Mountain" className="text-stone-400" size={32} />
              <div>
                <p className="text-slate-400 text-sm">Камень</p>
                <p className="text-2xl font-bold">{resources.stone}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Icon name="Map" size={24} />
                Игровое поле
              </h2>
              <div className="grid grid-cols-5 gap-3 mb-6">
                {Array.from({ length: 25 }).map((_, index) => {
                  const x = index % 5;
                  const y = Math.floor(index / 5);
                  const building = buildings.find((b) => b.x === x && b.y === y);

                  return (
                    <div
                      key={index}
                      onClick={() => building && setSelectedBuilding(building.id)}
                      className={`aspect-square rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
                        building
                          ? 'bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-600 hover:scale-105'
                          : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                      } ${selectedBuilding === building?.id ? 'ring-4 ring-yellow-500' : ''}`}
                    >
                      {building && (
                        <div className="text-center">
                          <Icon name={buildingIcons[building.type]} size={28} className="mx-auto mb-1" />
                          <span className="text-xs font-bold">Ур. {building.level}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedBuilding && (
                <Card className="bg-slate-700/50 border-slate-600 p-4">
                  {(() => {
                    const building = buildings.find((b) => b.id === selectedBuilding);
                    if (!building) return null;
                    const upgradeCost = {
                      gold: 50 * building.level,
                      wood: 30 * building.level,
                      stone: 20 * building.level,
                    };

                    return (
                      <div>
                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                          <Icon name={buildingIcons[building.type]} size={20} />
                          {buildingNames[building.type]} (Уровень {building.level})
                        </h3>
                        <div className="flex gap-4 mb-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Icon name="Coins" size={14} className="text-yellow-500" />
                            {upgradeCost.gold}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Trees" size={14} className="text-green-500" />
                            {upgradeCost.wood}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Mountain" size={14} className="text-stone-400" />
                            {upgradeCost.stone}
                          </span>
                        </div>
                        {building.type !== 'headquarters' && (
                          <Button onClick={() => upgradeBuilding(building.id)} className="w-full">
                            <Icon name="TrendingUp" size={16} className="mr-2" />
                            Улучшить здание
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </Card>
              )}

              <div className="mt-6">
                <h3 className="text-xl font-bold mb-3">Строительство</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(buildingCosts) as Array<keyof typeof buildingCosts>)
                    .filter((type) => type !== 'headquarters')
                    .map((type) => (
                      <Button
                        key={type}
                        onClick={() => buildBuilding(type)}
                        disabled={!canAfford(type)}
                        variant={canAfford(type) ? 'default' : 'outline'}
                        className="flex flex-col h-auto py-3"
                      >
                        <Icon name={buildingIcons[type]} size={24} className="mb-2" />
                        <span className="font-bold">{buildingNames[type]}</span>
                        <div className="flex gap-2 mt-2 text-xs">
                          <span className="flex items-center gap-1">
                            <Icon name="Coins" size={12} />
                            {buildingCosts[type].gold}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Trees" size={12} />
                            {buildingCosts[type].wood}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Mountain" size={12} />
                            {buildingCosts[type].stone}
                          </span>
                        </div>
                      </Button>
                    ))}
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Icon name="Trophy" size={24} className="text-yellow-500" />
                Достижения
              </h2>
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <Card
                    key={achievement.id}
                    className={`p-4 ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-600'
                        : 'bg-slate-700/30 border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <Icon
                        name={achievement.unlocked ? 'Award' : 'Lock'}
                        size={20}
                        className={achievement.unlocked ? 'text-yellow-500' : 'text-slate-500'}
                      />
                      <div className="flex-1">
                        <h3 className="font-bold">{achievement.title}</h3>
                        <p className="text-sm text-slate-400">{achievement.description}</p>
                        <p className="text-xs text-yellow-500 mt-1">{achievement.reward}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Прогресс</span>
                        <span>
                          {achievement.progress}/{achievement.target}
                        </span>
                      </div>
                      <Progress
                        value={(achievement.progress / achievement.target) * 100}
                        className="h-2"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyGame;
