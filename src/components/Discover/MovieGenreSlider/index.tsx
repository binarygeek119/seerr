import { genreColorMap } from '@app/components/Discover/constants';
import GenreCard from '@app/components/GenreCard';
import Slider from '@app/components/Slider';
import defineMessages from '@app/utils/defineMessages';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import type { GenreSliderItem } from '@server/interfaces/api/discoverInterfaces';
import { THEATRICAL_3D_GENRE_ID } from '@server/constants/theatrical3d';
import Link from 'next/link';
import React from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.Discover.MovieGenreSlider', {
  moviegenres: 'Movie Genres',
  theatrical3d: '3D',
});

const getGenreName = (
  genre: GenreSliderItem,
  formatMessage: (descriptor: {
    id?: string;
    defaultMessage?: string;
  }) => string
) => {
  if (genre.id === THEATRICAL_3D_GENRE_ID) {
    return formatMessage(messages.theatrical3d);
  }

  return genre.name;
};

const getGenreUrl = (genre: GenreSliderItem) => {
  if (genre.id === THEATRICAL_3D_GENRE_ID) {
    return '/discover/movies/3d';
  }

  return `/discover/movies?genre=${genre.id}`;
};

const getGenreImage = (genre: GenreSliderItem) => {
  const backdrop = genre.backdrops[4] ?? genre.backdrops[0] ?? '';

  return `https://image.tmdb.org/t/p/w1280_filter(duotone,${
    genreColorMap[genre.id] ?? genreColorMap[0]
  })${backdrop}`;
};

const MovieGenreSlider = () => {
  const intl = useIntl();
  const { data, error } = useSWR<GenreSliderItem[]>(
    `/api/v1/discover/genreslider/movie`,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  );

  return (
    <>
      <div className="slider-header">
        <Link href="/discover/movies/genres" className="slider-title">
          <span>{intl.formatMessage(messages.moviegenres)}</span>
          <ArrowRightCircleIcon />
        </Link>
      </div>
      <Slider
        sliderKey="movie-genres"
        isLoading={!data && !error}
        isEmpty={false}
        items={(data ?? []).map((genre, index) => (
          <GenreCard
            key={`genre-${genre.id}-${index}`}
            name={getGenreName(genre, intl.formatMessage)}
            image={getGenreImage(genre)}
            url={getGenreUrl(genre)}
          />
        ))}
        placeholder={<GenreCard.Placeholder />}
        emptyMessage=""
      />
    </>
  );
};

export default React.memo(MovieGenreSlider);
