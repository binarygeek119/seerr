import Modal from '@app/components/Common/Modal';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import type { MovieRequestQuality } from '@server/lib/movieRequestQuality';
import { useIntl } from 'react-intl';

const messages = defineMessages('components.RequestModal.MovieQualityPicker', {
  title: 'Choose Movie Quality',
  standard: 'Standard',
  standardDescription: 'Request the standard HD version',
  quality4k: '4K',
  quality4kDescription: 'Request the 4K version',
  quality3d: '3D',
  quality3dDescription: 'Request the 3D version',
});

interface MovieQualityPickerProps {
  onCancel: () => void;
  options: MovieRequestQuality[];
  onSelect: (quality: MovieRequestQuality) => void;
}

const MovieQualityPicker = ({
  onCancel,
  options,
  onSelect,
}: MovieQualityPickerProps) => {
  const intl = useIntl();

  const optionLabels: Record<
    MovieRequestQuality,
    { label: string; description: string }
  > = {
    hd: {
      label: intl.formatMessage(messages.standard),
      description: intl.formatMessage(messages.standardDescription),
    },
    '4k': {
      label: intl.formatMessage(messages.quality4k),
      description: intl.formatMessage(messages.quality4kDescription),
    },
    '3d': {
      label: intl.formatMessage(messages.quality3d),
      description: intl.formatMessage(messages.quality3dDescription),
    },
  };

  return (
    <Modal
      onCancel={onCancel}
      title={intl.formatMessage(messages.title)}
      cancelText={intl.formatMessage(globalMessages.close)}
    >
      <div className="flex flex-col gap-3">
        {options.map((quality) => (
          <button
            key={quality}
            type="button"
            className="rounded-lg border border-gray-600 bg-gray-800 p-4 text-left transition duration-150 hover:border-indigo-500 hover:bg-gray-700"
            onClick={() => onSelect(quality)}
          >
            <span className="block text-lg font-semibold text-white">
              {optionLabels[quality].label}
            </span>
            <span className="mt-1 block text-sm text-gray-400">
              {optionLabels[quality].description}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
};

export default MovieQualityPicker;
