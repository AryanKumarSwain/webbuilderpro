// List of curated theme keys available across the platform
const ALL_THEME_KEYS = [
    // Classic Gradients
    'rosePink', 'blue', 'green', 'purple', 'orange', 'slate', 'red', 'teal',
    'navy', 'burgundy', 'olive', 'cyan', 'amber', 'indigo', 'coral', 'mustard',
    // Light & Bright Gradients
    'brightCyan', 'brightLime', 'brightViolet', 'brightTangerine', 'brightMagenta',
    'brightSunshine', 'brightSky', 'brightWatermelon', 'pastelMint', 'pastelLilac',
    'pastelPeach', 'pastelSky',
    // Classic Solids
    'solidRoyalBlue', 'solidNavy', 'solidSky', 'solidTeal', 'solidEmerald',
    'solidForest', 'solidCrimson', 'solidMaroon', 'solidPurple', 'solidSaffron',
    'solidAmber', 'solidCoral', 'solidIndigo', 'solidLemon', 'solidLime',
    // Light Solids
    'solidPowderBlue', 'solidBabyBlue', 'solidPastelMint', 'solidSeafoam',
    'solidSage', 'solidPastelPeach', 'solidPastelPink', 'solidBlush',
    'solidLavender', 'solidPastelLilac', 'solidPeriwinkle', 'solidButtercup',
    'solidIceCyan'
];

const getRandomThemeKey = () => {
    const idx = Math.floor(Math.random() * ALL_THEME_KEYS.length);
    return ALL_THEME_KEYS[idx];
};

module.exports = {
    ALL_THEME_KEYS,
    getRandomThemeKey,
};
