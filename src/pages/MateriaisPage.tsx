import { useState, useMemo } from 'react';
import { Plus, Package, AlertTriangle, Search, Edit, Trash } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useMaterials, useDeleteMaterial } from '@/hooks/useMaterials';
import { Material, MaterialCategory } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { MaterialModal } from '@/components/materials/MaterialModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';

const categoryLabels: Record<MaterialCategory, string> = {
  needles: 'Agulhas',
  ink: 'Tintas',
  tips: 'Biqueiras',
  gloves: 'Luvas',
  paper: 'Papel',
  film: 'Filme',
  cleaning: 'Limpeza',
  other: 'Outros',
};

const categoryColors: Record<MaterialCategory, string> = {
  needles: 'hsl(68, 100%, 50%)',
  ink: 'hsl(200, 100%, 50%)',
  tips: 'hsl(280, 100%, 60%)',
  gloves: 'hsl(142, 76%, 36%)',
  paper: 'hsl(38, 92%, 50%)',
  film: 'hsl(0, 72%, 51%)',
  cleaning: 'hsl(180, 70%, 45%)',
  other: 'hsl(240, 5%, 55%)',
};

export default function MateriaisPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const { data: materials, isLoading } = useMaterials();
  const deleteMaterial = useDeleteMaterial();

  const filteredMaterials = useMemo(() => {
    if (!materials) return [];
    if (!search) return materials;
    return materials.filter(m => 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [materials, search]);

  const stats = useMemo(() => {
    if (!materials) return { totalValue: 0, itemCount: 0, lowStock: 0 };
    
    return {
      totalValue: materials.reduce((sum, m) => sum + (m.qty_current * m.unit_cost), 0),
      itemCount: materials.length,
      lowStock: materials.filter(m => m.qty_current <= m.min_qty).length,
    };
  }, [materials]);

  const chartData = useMemo(() => {
    if (!materials) return [];
    
    const byCategory = materials.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + (m.qty_current * m.unit_cost);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byCategory)
      .filter(([_, value]) => value > 0)
      .map(([category, value]) => ({
        name: categoryLabels[category as MaterialCategory],
        value,
        color: categoryColors[category as MaterialCategory],
      }));
  }, [materials]);

  const handleDelete = (material: Material) => {
    if (confirm(`Excluir ${material.name}?`)) {
      deleteMaterial.mutate(material.id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <Header showFilter={false} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              title="Valor em Estoque"
              value={formatCurrency(stats.totalValue)}
              icon={<Package className="h-5 w-5 text-primary" />}
              variant="primary"
            />
            <StatCard
              title="Itens Cadastrados"
              value={stats.itemCount}
              icon={<Package className="h-5 w-5 text-muted-foreground" />}
            />
            <StatCard
              title="Itens em Alerta"
              value={stats.lowStock}
              subtitle={stats.lowStock ? 'Precisam reposição' : 'Estoque OK'}
              icon={<AlertTriangle className={cn('h-5 w-5', stats.lowStock ? 'text-warning' : 'text-success')} />}
              variant={stats.lowStock ? 'warning' : 'success'}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="glass-card p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Inventário por Categoria</h3>
          {isLoading ? (
            <div className="h-64 skeleton-pulse rounded-xl" />
          ) : chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(240, 8%, 12%)',
                      border: '1px solid hsl(240, 6%, 20%)',
                      borderRadius: '0.75rem',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={Package} title="Sem dados" description="Adicione materiais para ver o gráfico" />
          )}
        </div>

        {/* Materials list */}
        <div className="lg:col-span-2 glass-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar material..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 input-glass"
              />
            </div>
            <Button onClick={() => setShowModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>

          {isLoading ? (
            <SkeletonList count={5} />
          ) : filteredMaterials.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredMaterials.map((material) => {
                const isLowStock = material.qty_current <= material.min_qty;
                return (
                  <div
                    key={material.id}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-xl bg-muted/30 transition-all hover:bg-muted/50',
                      isLowStock && 'border border-warning/30'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{material.name}</span>
                        {isLowStock && (
                          <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-medium">
                            Baixo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                          {categoryLabels[material.category]}
                        </span>
                        <span>{formatCurrency(material.unit_cost)}/{material.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={cn(
                          'text-lg font-semibold',
                          isLowStock ? 'text-warning' : 'text-foreground'
                        )}>
                          {material.qty_current} {material.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">mín: {material.min_qty}</p>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedMaterial(material)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(material)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="Nenhum material encontrado"
              description={search ? 'Tente buscar com outros termos' : 'Comece adicionando seus materiais'}
              action={
                <Button onClick={() => setShowModal(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" /> Adicionar material
                </Button>
              }
            />
          )}
        </div>
      </div>

      <MaterialModal
        open={showModal || !!selectedMaterial}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setSelectedMaterial(null);
        }}
        material={selectedMaterial || undefined}
      />
    </div>
  );
}
