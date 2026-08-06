import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useMemo,
  useEffect,
  makeTheme,
  isUpKey,
  isDownKey,
  isSpaceKey,
  isEnterKey,
} from '@inquirer/core';
import { cursorHide } from '@inquirer/ansi';
import { styleText } from 'node:util';
import figures from '@inquirer/figures';

const checkboxTheme = {
  icon: {
    checked: styleText('green', figures.circleFilled),
    unchecked: figures.circle,
    cursor: figures.pointer,
  },
  style: {
    renderSelectedChoices: (selectedChoices) => selectedChoices.map((choice) => choice.short).join(', '),
    description: (text) => styleText('cyan', text),
    keysHelpTip: (keys) =>
      keys
        .map(([key, action]) => `${styleText('bold', key)} ${styleText('dim', action)}`)
        .join(styleText('dim', ' • ')),
    categoryActive: (text) => styleText(['cyan', 'bold'], text),
    categoryInactive: (text) => styleText('dim', text),
    categoryCount: (text) => styleText('yellow', text),
  },
};

function isLeftKey(key) {
  return key.name === 'left';
}

function isRightKey(key) {
  return key.name === 'right';
}

function normalizeChoices(choices) {
  return choices.map((choice) => {
    const name = choice.name ?? String(choice.value);
    return {
      value: choice.value,
      name,
      short: choice.short ?? name,
      checkedName: choice.checkedName ?? name,
      disabled: choice.disabled ?? false,
      checked: choice.checked ?? false,
      description: choice.description,
    };
  });
}

function isSelectable(item) {
  return !item.disabled;
}

function toggle(item) {
  return isSelectable(item) ? { ...item, checked: !item.checked } : item;
}

function normalizeCategories(categories) {
  return categories.map((category) => ({
    name: category.name,
    items: normalizeChoices(category.choices),
  }));
}

function countChecked(items) {
  return items.filter((item) => item.checked).length;
}

function allCheckedItems(categories) {
  return categories.flatMap((category) => category.items.filter((item) => item.checked));
}

export const categoryCheckbox = createPrompt((config, done) => {
  const { pageSize = 10, loop = true, required = false, validate = () => true } = config;
  const theme = makeTheme(checkboxTheme, config.theme);
  const { keybindings } = theme;

  const [status, setStatus] = useState('idle');
  const prefix = usePrefix({ status, theme });
  const [categories, setCategories] = useState(() => normalizeCategories(config.categories));
  const [activeCategory, setActiveCategory] = useState(0);
  const [errorMsg, setError] = useState();

  const currentItems = categories[activeCategory]?.items ?? [];

  const bounds = useMemo(() => {
    const first = currentItems.findIndex(isSelectable);
    const last = currentItems.findLastIndex(isSelectable);
    if (first === -1) {
      return { first: 0, last: -1 };
    }
    return { first, last };
  }, [currentItems]);

  const [active, setActive] = useState(bounds.first);

  useEffect(() => {
    setActive(bounds.first);
  }, [activeCategory, bounds.first]);

  useKeypress(async (key) => {
    if (isEnterKey(key)) {
      const selection = allCheckedItems(categories);
      const isValid = await validate([...selection]);
      if (required && !selection.length) {
        setError('At least one choice must be selected');
      } else if (isValid === true) {
        setStatus('done');
        done(selection.map((choice) => choice.value));
      } else {
        setError(isValid || 'You must select a valid value');
      }
    } else if (isLeftKey(key)) {
      if (errorMsg) setError(undefined);
      setActiveCategory((index) => (index - 1 + categories.length) % categories.length);
    } else if (isRightKey(key)) {
      if (errorMsg) setError(undefined);
      setActiveCategory((index) => (index + 1) % categories.length);
    } else if (isUpKey(key, keybindings) || isDownKey(key, keybindings)) {
      if (errorMsg) setError(undefined);
      if (bounds.last === -1) return;

      if (
        loop ||
        (isUpKey(key, keybindings) && active !== bounds.first) ||
        (isDownKey(key, keybindings) && active !== bounds.last)
      ) {
        const offset = isUpKey(key, keybindings) ? -1 : 1;
        let next = active;
        do {
          next = (next + offset + currentItems.length) % currentItems.length;
        } while (!isSelectable(currentItems[next]));
        setActive(next);
      }
    } else if (isSpaceKey(key)) {
      const activeItem = currentItems[active];
      if (!activeItem || !isSelectable(activeItem)) return;

      setError(undefined);
      setCategories(
        categories.map((category, categoryIndex) =>
          categoryIndex === activeCategory
            ? {
                ...category,
                items: category.items.map((item, itemIndex) =>
                  itemIndex === active ? toggle(item) : item,
                ),
              }
            : category,
        ),
      );
    }
  });

  const message = theme.style.message(config.message, status);

  const categoryTabs = categories
    .map((category, index) => {
      const selectedCount = countChecked(category.items);
      const countSuffix = selectedCount > 0 ? theme.style.categoryCount(` (${selectedCount})`) : '';
      const label = `${category.name}${countSuffix}`;
      return index === activeCategory ? theme.style.categoryActive(label) : theme.style.categoryInactive(label);
    })
    .join('  ');

  let description;
  const page = usePagination({
    items: currentItems,
    active,
    renderItem({ item, isActive }) {
      if (!isSelectable(item)) {
        const disabledLabel = typeof item.disabled === 'string' ? item.disabled : '(disabled)';
        const checkbox = item.checked ? theme.icon.checked : theme.icon.unchecked;
        return theme.style.disabled(`${' '}${checkbox} ${item.name} ${disabledLabel}`);
      }

      if (isActive) {
        description = item.description;
      }

      const cursor = isActive ? theme.icon.cursor : ' ';
      const checkbox = item.checked ? theme.icon.checked : theme.icon.unchecked;
      const name = item.checked ? item.checkedName : item.name;
      const color = isActive ? theme.style.highlight : (text) => text;
      return color(`${cursor}${checkbox} ${name}`);
    },
    pageSize,
    loop,
  });

  if (status === 'done') {
    const selection = allCheckedItems(categories);
    const answer = theme.style.answer(theme.style.renderSelectedChoices(selection, categories));
    return [prefix, message, answer].filter(Boolean).join(' ');
  }

  const keys = [
    ['←→', 'category'],
    ['↑↓', 'navigate'],
    ['space', 'select'],
    ['⏎', 'submit'],
  ];
  const helpLine = theme.style.keysHelpTip(keys);

  const lines = [
    [prefix, message].filter(Boolean).join(' '),
    '',
    `  ${styleText('dim', figures.arrowLeft)}  ${categoryTabs}  ${styleText('dim', figures.arrowRight)}`,
    '',
    currentItems.length > 0 ? page : styleText('dim', '  (no skills in this category)'),
    ' ',
    description ? theme.style.description(description) : '',
    errorMsg ? theme.style.error(errorMsg) : '',
    helpLine,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .trimEnd();

  return `${lines}${cursorHide}`;
});
