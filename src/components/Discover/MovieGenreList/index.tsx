import Header from '@app/components/Common/Header';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import { genreColorMap } from '@app/components/Discover/constants';
import GenreCard from '@app/components/GenreCard';
import ErrorPage from '@app/pages/_error';
import defineMessages from '@app/utils/defineMessages';
import type { GenreSliderItem } from '@server/interfaces/api/discoverInterfaces';
import { THEATRICAL_3D_GENRE_ID } from '@server/constants/theatrical3d';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.Discover.MovieGenreList', {
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

  return `/discover/movies/genre/${genre.id}`;
};

const getGenreImage = (genre: GenreSliderItem) => {
  const backdrop = genre.backdrops[4] ?? genre.backdrops[0] ?? '';

  return `https://image.tmdb.org/t/p/w1280_filter(duotone,${
    genreColorMap[genre.id] ?? genreColorMap[0]
  })${backdrop}`;
};

const MovieGenreList = () => {
  const intl = useIntl();
  const { data, error } = useSWR<GenreSliderItem[]>(
    `/api/v1/discover/genreslider/movie`
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <>
      <PageTitle title={intl.formatMessage(messages.moviegenres)} />
      <div className="mb-5 mt-1">
        <Header>{intl.formatMessage(messages.moviegenres)}</Header>
      </div>
      <ul className="cards-horizontal">
        {data.map((genre, index) => (
          <li key={`genre-${genre.id}-${index}`}>
            <GenreCard
              name={getGenreName(genre, intl.formatMessage)}
              image={getGenreImage(genre)}
              url={getGenreUrl(genre)}
              canExpand
            />
          </li>
        ))}
      </ul>
    </>
  );
};

export default MovieGenreList;
