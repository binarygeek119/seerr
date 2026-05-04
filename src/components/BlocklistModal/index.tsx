import Modal from '@app/components/Common/Modal';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { Transition } from '@headlessui/react';

import type { Collection } from '@server/models/Collection';
import type { MovieDetails } from '@server/models/Movie';
import type { MusicDetails } from '@server/models/Music';
import type { TvDetails } from '@server/models/Tv';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

interface BlocklistModalProps {
  tmdbId?: number;
  mbId?: string;
  type: 'movie' | 'tv' | 'collection' | 'music';
  show: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
  isUpdating?: boolean;
}

const messages = defineMessages('component.BlocklistModal', {
  blocklisting: 'Blocklisting',
});

type ModalMedia = MovieDetails | TvDetails | Collection | MusicDetails;

const isCollection = (data: ModalMedia | null): data is Collection => {
  return (
    data !== null &&
    data !== undefined &&
    (data as Collection).parts !== undefined
  );
};

const isMusic = (data: ModalMedia | null): data is MusicDetails => {
  if (!data) return false;
  return (
    'artist' in data && typeof (data as MusicDetails).artist?.name === 'string'
  );
};

const isMovie = (data: ModalMedia | null): data is MovieDetails => {
  if (!data || isCollection(data) || isMusic(data)) return false;
  return (data as MovieDetails).title !== undefined;
};

const BlocklistModal = ({
  tmdbId,
  mbId,
  type,
  show,
  onComplete,
  onCancel,
  isUpdating,
}: BlocklistModalProps) => {
  const intl = useIntl();
  const [data, setData] = useState<ModalMedia | null>(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      if (!show) return;
      try {
        setError(null);
        const response = await axios.get(
          `/api/v1/${type}/${type === 'music' ? mbId : tmdbId}`
        );
        setData(response.data);
      } catch (err) {
        setError(err);
      }
    })();
  }, [show, tmdbId, mbId, type]);

  const getTitle = () => {
    if (!data) return '';
    if (isCollection(data)) {
      return data.name;
    }
    if (isMusic(data)) {
      return `${data.artist.name} - ${data.title}`;
    }
    if (isMovie(data)) {
      return data.title;
    }
    return data.name;
  };

  const modalKindLabel =
    type === 'collection'
      ? intl.formatMessage(globalMessages.collection)
      : type === 'music'
        ? intl.formatMessage(globalMessages.music)
        : type === 'movie'
          ? intl.formatMessage(globalMessages.movie)
          : intl.formatMessage(globalMessages.tvshow);

  const getBackdrop = () => {
    if (isMusic(data)) {
      return data.artistBackdrop;
    }
    return `https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data?.backdropPath}`;
  };

  return (
    <Transition
      as="div"
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={show}
    >
      <Modal
        loading={!data && !error}
        backgroundClickable
        title={`${intl.formatMessage(globalMessages.blocklist)} ${modalKindLabel}`}
        subTitle={getTitle()}
        onCancel={onCancel}
        onOk={onComplete}
        okText={
          isUpdating
            ? intl.formatMessage(messages.blocklisting)
            : intl.formatMessage(globalMessages.blocklist)
        }
        okButtonType="danger"
        okDisabled={isUpdating}
        backdrop={getBackdrop()}
      />
    </Transition>
  );
};

export default BlocklistModal;
