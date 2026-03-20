'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import type { Artist } from '@piums/sdk';

interface ArtistCardProps {
  artist: Artist;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  return (
    <Link href={`/artists/${artist.slug || artist.id}`}>
      <Card hover padding="none" className="overflow-hidden h-full">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
          {artist.coverPhoto && (
            <Image
              src={artist.coverPhoto}
              alt={artist.nombre}
              fill
              className="object-cover"
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          )}
          
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {artist.isVerified && (
              <Badge variant="success" size="sm" className="bg-white text-green-600">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verificado
              </Badge>
            )}
            {artist.isPremium && (
              <Badge variant="warning" size="sm" className="bg-yellow-100 text-yellow-800">
                Premium
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          {/* Avatar & Name */}
          <div className="flex items-start space-x-3 mb-3">
            <Avatar
              src={artist.avatar}
              fallback={artist.nombre}
              size="lg"
              className="border-2 border-white shadow-md -mt-8"
            />
            <div className="flex-1 mt-1">
              <h3 className="text-lg font-semibold text-gray-900">{artist.nombre}</h3>
              {artist.category && (
                <p className="text-sm text-gray-600">{artist.category}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {artist.bio && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {artist.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            {artist.rating && (
              <div className="flex items-center">
                <svg className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-medium">{artist.rating.toFixed(1)}</span>
                {artist.reviewsCount && (
                  <span className="ml-1">({artist.reviewsCount})</span>
                )}
              </div>
            )}
            {artist.bookingsCount !== undefined && artist.bookingsCount > 0 && (
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{artist.bookingsCount} reservas</span>
              </div>
            )}
            {artist.experienceYears && (
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{artist.experienceYears} años</span>
              </div>
            )}
          </div>

          {/* City */}
          {artist.cityId && (
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{artist.cityId}</span>
            </div>
          )}

          {/* CTA Button */}
          <Button fullWidth size="sm" variant="primary">
            Ver Perfil
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};
