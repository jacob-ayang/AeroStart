# 多语言架构使用指南 (i18n Architecture Guide)

## 📁 项目结构

```
i18n/
├── types.ts              # 类型定义
├── locales/
│   ├── en.ts            # 英文翻译
│   └── zh.ts            # 中文翻译
├── I18nContext.tsx      # Context 和 Provider
├── index.ts             # 导出文件
└── README.md            # 本文档
```

## 🚀 快速开始

### 1. 在组件中使用翻译

```tsx
import { useTranslation } from '../i18n';

const MyComponent = () => {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div>
      <h1>{t.settings}</h1>
      <p>{t.appearance}</p>
      <button onClick={() => setLanguage('zh')}>切换到中文</button>
    </div>
  );
};
```

### 2. 添加新的翻译键

#### 步骤 1: 在 `types.ts` 中添加类型定义

```typescript
export interface Translation {
  // ... 现有的键
  myNewKey: string;
}
```

#### 步骤 2: 在 `locales/en.ts` 中添加英文翻译

```typescript
export const en: Translation = {
  // ... 现有的翻译
  myNewKey: 'My New Text',
};
```

#### 步骤 3: 在 `locales/zh.ts` 中添加中文翻译

```typescript
export const zh: Translation = {
  // ... 现有的翻译
  myNewKey: '我的新文本',
};
```

### 3. 在组件中使用新的翻译键

```tsx
const MyComponent = () => {
  const { t } = useTranslation();

  return <div>{t.myNewKey}</div>;
};
```

## 📝 已支持的语言

- **English (en)** - 英语
- **简体中文 (zh)** - Simplified Chinese

## 🎯 已翻译的组件

以下组件已经集成了多语言支持：

- ✅ **ThemeSettings** - 主题设置（包含语言切换器）
- ⏳ **SettingsModal** - 设置模态框（待更新）
- ⏳ **SearchBox** - 搜索框（待更新）
- ⏳ **SearchEngineManager** - 搜索引擎管理器（待更新）
- ⏳ **WallpaperManager** - 壁纸管理器（待更新）
- ⏳ **GlobalContextMenu** - 全局右键菜单（待更新）
- ⏳ **ErrorBoundary** - 错误边界（待更新）
- ⏳ **Clock** - 时钟（待更新）

## 🔧 API 参考

### `useTranslation()` Hook

返回一个包含以下属性的对象：

- **`t`**: `Translation` - 当前语言的翻译对象
- **`language`**: `Language` - 当前语言 ('en' | 'zh')
- **`setLanguage`**: `(lang: Language) => void` - 切换语言的函数

### `I18nProvider` Component

Props:
- **`language`**: `Language` - 当前语言
- **`onLanguageChange`**: `(lang: Language) => void` - 语言变化回调
- **`children`**: `ReactNode` - 子组件

## 💡 最佳实践

### 1. 保持翻译键的一致性

使用描述性的键名，例如：
- ✅ `searchEngineDeleted`
- ❌ `msg1`

### 2. 避免在翻译中使用 HTML

如果需要格式化文本，使用多个翻译键：

```tsx
// ❌ 不推荐
myKey: '<strong>Bold</strong> text'

// ✅ 推荐
myKeyBold: 'Bold'
myKeyText: 'text'

// 在组件中使用
<div><strong>{t.myKeyBold}</strong> {t.myKeyText}</div>
```

### 3. 为长文本使用描述性键名

```typescript
// ✅ 好的命名
errorMessage: 'The application encountered an unexpected error...'

// ❌ 不好的命名
error: 'The application encountered an unexpected error...'
```

### 4. 组织相关的翻译键

在 `Translation` 接口中使用注释分组：

```typescript
export interface Translation {
  // Common
  settings: string;
  appearance: string;

  // Theme Settings
  themeColor: string;
  showSeconds: string;

  // Error Messages
  errorMessage: string;
  somethingWentWrong: string;
}
```

## 🌍 添加新语言

### 步骤 1: 在 `types.ts` 中添加语言类型

```typescript
export type Language = 'en' | 'zh' | 'ja'; // 添加 'ja' 日语
```

### 步骤 2: 创建新的语言文件

创建 `locales/ja.ts`:

```typescript
import { Translation } from '../types';

export const ja: Translation = {
  settings: '設定',
  appearance: '外観',
  // ... 其他翻译
};
```

### 步骤 3: 在 `I18nContext.tsx` 中注册新语言

```typescript
const translations: Record<Language, Translation> = {
  en,
  zh,
  ja, // 添加日语
};
```

### 步骤 4: 在 `ThemeSettings` 中添加语言选项

```tsx
<button onClick={() => handleLanguageChange('ja')}>
  日本語
</button>
```

## 🐛 故障排除

### 问题：翻译不显示

**解决方案：**
1. 确保组件在 `I18nProvider` 内部
2. 检查是否正确导入了 `useTranslation`
3. 验证翻译键在所有语言文件中都存在

### 问题：TypeScript 错误

**解决方案：**
1. 确保所有语言文件都实现了 `Translation` 接口
2. 运行 `npx tsc --noEmit` 检查类型错误
3. 确保新添加的键在 `types.ts` 中有定义

## 📚 相关文件

- `types.ts` - UserSettings 类型（包含 language 字段）
- `App.tsx` - I18nProvider 集成
- `utils/storage.ts` - 语言偏好持久化

## 🎉 完成！

现在你已经了解了如何使用和扩展多语言架构。如果有任何问题，请参考现有组件的实现或查看本文档。
