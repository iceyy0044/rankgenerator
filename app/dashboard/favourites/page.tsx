'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

interface Favourite {
  id: number;
  name: string;
  background: string;
  text_color: string;
  text_outline_color: string;
  badge_left_color: string;
  badge_right_color: string;
  badge_text: string;
  badge_text_color: string;
  badge_text_outline_color: string;
}

export default function FavouritesPage() {
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchFavourites = async () => {
      const response = await fetch('/api/favourites/list');
      if (response.ok) {
        const data = await response.json();
        setFavourites(data);
      } else {
        toast({
          title: 'Error fetching favourites',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      }
    };
    fetchFavourites();
  }, []);

  const loadFavourite = (fav: Favourite) => {
    const params = new URLSearchParams();
    Object.entries(fav).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'name' && value) {
        params.append(key, value);
      }
    });
    router.push(`/dashboard?${params.toString()}`);
  };

  const deleteFavourite = async (id: number) => {
    const response = await fetch('/api/favourites/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      setFavourites(favourites.filter((fav) => fav.id !== id));
      toast({
        title: 'Favourite deleted',
      });
    } else {
      toast({
        title: 'Error deleting favourite',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {favourites.map((fav) => (
        <Card key={fav.id}>
          <CardHeader>
            <CardTitle>{fav.name || 'Unnamed'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
            <Button onClick={() => loadFavourite(fav)}>Load</Button>
            <Button variant="destructive" onClick={() => deleteFavourite(fav.id)}>
              Delete
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
