import TitleCard from '@app/components/TitleCard';
import { useProgressiveCovers } from '@app/hooks/useProgressiveCovers';
import { Permission, useUser } from '@app/hooks/useUser';
import type { BookDetails } from '@server/models/Book';
import type { MovieDetails } from '@server/models/Movie';
import type { MusicDetails } from '@server/models/Music';
import type { TvDetails } from '@server/models/Tv';
import { useInView } from 'react-intersection-observer';
import useSWR from 'swr';

export interface AddedCardProps {
  id?: number | string;
  tmdbId?: number;
  tvdbId?: number;
  mbId?: string;
  foreignBookId?: string;
  type: 'movie' | 'tv' | 'music' | 'book';
  canExpand?: boolean;
  isAddedToWatchlist?: boolean;
  mutateParent?: () => void;
  posterPath?: string | null;
  needsCoverArt?: boolean;
}

const isBook = (
  media: MovieDetails | TvDetails | MusicDetails | BookDetails
): media is BookDetails => {
  return (media as BookDetails).mediaType === 'book';
};

const isMovie = (
  media: MovieDetails | TvDetails | MusicDetails | BookDetails
): media is MovieDetails => {
  if (isBook(media)) {
    return false;
  }
  return (media as MovieDetails).title !== undefined;
};

const isMusic = (
  media: MovieDetails | TvDetails | MusicDetails | BookDetails
): media is MusicDetails => {
  if (isBook(media)) {
    return false;
  }
  return (media as MusicDetails).artist !== undefined;
};

const AddedCard = ({
  id,
  tmdbId,
  tvdbId,
  mbId,
  foreignBookId,
  type,
  canExpand,
  isAddedToWatchlist = false,
  mutateParent,
  posterPath: initialPosterPath,
  needsCoverArt: initialNeedsCoverArt,
}: AddedCardProps) => {
  const { hasPermission } = useUser();

  const { ref, inView } = useInView({
    triggerOnce: true,
  });

  const url =
    type === 'book'
      ? foreignBookId
        ? `/api/v1/book/${encodeURIComponent(foreignBookId)}`
        : null
      : type === 'music'
        ? `/api/v1/music/${mbId}`
        : type === 'movie'
          ? `/api/v1/movie/${tmdbId}`
          : `/api/v1/tv/${tmdbId}`;

  const { data: titleData, error } = useSWR<
    MovieDetails | TvDetails | MusicDetails | BookDetails
  >(inView ? url : null);

  const title =
    useProgressiveCovers<MovieDetails | TvDetails | MusicDetails | BookDetails>(
      type === 'music' &&
        titleData &&
        isMusic(titleData) &&
        (initialPosterPath || initialNeedsCoverArt)
        ? [
            {
              ...titleData,
              posterPath: initialPosterPath || titleData.posterPath,
              needsCoverArt:
                initialNeedsCoverArt ??
                (titleData as MusicDetails & { needsCoverArt?: boolean })
                  .needsCoverArt,
            } as MusicDetails,
          ]
        : titleData
          ? [titleData]
          : []
    )[0] ?? titleData;

  if (!title && !error) {
    return (
      <div ref={ref}>
        <TitleCard.Placeholder canExpand={canExpand} />
      </div>
    );
  }

    if (!title) {
    return hasPermission(Permission.ADMIN) && id ? (
      <TitleCard.ErrorCard
        id={id}
        tmdbId={tmdbId}
        tvdbId={tvdbId}
        mbId={mbId}
        foreignBookId={foreignBookId}
        type={type}
      />
    ) : null;
  }

  if (isBook(title)) {
    return (
      <TitleCard
        key={title.id}
        id={title.foreignBookId}
        isAddedToWatchlist={
          title.mediaInfo?.watchlists?.length || isAddedToWatchlist
        }
        image={title.posterPath}
        status={title.mediaInfo?.status}
        summary={title.overview}
        title={title.title}
        artist={title.author.authorName}
        year={title.releaseDate}
        mediaType={'book'}
        canExpand={canExpand}
        mutateParent={mutateParent}
      />
    );
  }

  if (isMusic(title)) {
    return (
      <TitleCard
        key={title.id}
        id={title.id}
        isAddedToWatchlist={
          title.mediaInfo?.watchlists?.length || isAddedToWatchlist
        }
        image={title.posterPath}
        status={title.mediaInfo?.status}
        title={title.title}
        artist={title.artist.name}
        type={title.type}
        year={title.releaseDate}
        mediaType={'album'}
        canExpand={canExpand}
        mutateParent={mutateParent}
      />
    );
  }

  return isMovie(title) ? (
    <TitleCard
      key={title.id}
      id={title.id}
      isAddedToWatchlist={
        title.mediaInfo?.watchlists?.length || isAddedToWatchlist
      }
      image={title.posterPath}
      status={title.mediaInfo?.status}
      summary={title.overview}
      title={title.title}
      userScore={title.voteAverage}
      year={title.releaseDate}
      mediaType={'movie'}
      hasTheatrical3dVersion={title.hasTheatrical3dVersion}
      canExpand={canExpand}
      mutateParent={mutateParent}
    />
  ) : (
    <TitleCard
      key={title.id}
      id={title.id}
      isAddedToWatchlist={
        title.mediaInfo?.watchlists?.length || isAddedToWatchlist
      }
      image={title.posterPath}
      status={title.mediaInfo?.status}
      summary={title.overview}
      title={title.name}
      userScore={title.voteAverage}
      year={title.firstAirDate}
      mediaType={'tv'}
      canExpand={canExpand}
      mutateParent={mutateParent}
    />
  );
};

export default AddedCard;
