export function renderNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 10000) {
    return (num / 1000).toFixed(1) + "k";
  } else {
    return num;
  }
}

export function renderQuotaNumberWithDigit(num, digits = 2) {
  if (typeof num !== "number" || isNaN(num)) {
    return 0;
  }
  const quotaDisplayType = localStorage.getItem("quota_display_type") || "USD";
  num = num.toFixed(digits);
  if (quotaDisplayType === "CNY") {
    return "¥" + num;
  } else if (quotaDisplayType === "USD") {
    return "$" + num;
  } else if (quotaDisplayType === "CUSTOM") {
    const statusStr = localStorage.getItem("status");
    let symbol = "¤";
    try {
      if (statusStr) {
        const s = JSON.parse(statusStr);
        symbol = s?.custom_currency_symbol || symbol;
      }
    } catch (e) {}
    return symbol + num;
  } else {
    return num;
  }
}

export function renderNumberWithPoint(num) {
  if (num === undefined) return "";
  num = num.toFixed(2);
  if (num >= 100000) {
    // Convert number to string to manipulate it
    let numStr = num.toString();
    // Find the position of the decimal point
    let decimalPointIndex = numStr.indexOf(".");

    let wholePart = numStr;
    let decimalPart = "";

    // If there is a decimal point, split the number into whole and decimal parts
    if (decimalPointIndex !== -1) {
      wholePart = numStr.slice(0, decimalPointIndex);
      decimalPart = numStr.slice(decimalPointIndex);
    }

    // Take the first two and last two digits of the whole number part
    let shortenedWholePart = wholePart.slice(0, 2) + ".." + wholePart.slice(-2);

    // Return the formatted number
    return shortenedWholePart + decimalPart;
  }

  // If the number is less than 100,000, return it unmodified
  return num;
}

export function getQuotaPerUnit() {
  let quotaPerUnit = localStorage.getItem("quota_per_unit");
  quotaPerUnit = parseFloat(quotaPerUnit);
  return quotaPerUnit;
}

export function renderUnitWithQuota(quota) {
  let quotaPerUnit = localStorage.getItem("quota_per_unit");
  quotaPerUnit = parseFloat(quotaPerUnit);
  quota = parseFloat(quota);
  return quotaPerUnit * quota;
}

export function getQuotaWithUnit(quota, digits = 6) {
  let quotaPerUnit = localStorage.getItem("quota_per_unit");
  quotaPerUnit = parseFloat(quotaPerUnit);
  return (quota / quotaPerUnit).toFixed(digits);
}

export function renderQuotaWithAmount(amount) {
  const quotaDisplayType = localStorage.getItem("quota_display_type") || "USD";
  if (quotaDisplayType === "TOKENS") {
    return renderNumber(renderUnitWithQuota(amount));
  }
  if (quotaDisplayType === "CNY") {
    return "¥" + amount;
  } else if (quotaDisplayType === "CUSTOM") {
    const statusStr = localStorage.getItem("status");
    let symbol = "¤";
    try {
      if (statusStr) {
        const s = JSON.parse(statusStr);
        symbol = s?.custom_currency_symbol || symbol;
      }
    } catch (e) {}
    return symbol + amount;
  }
  return "$" + amount;
}

/**
 * 获取当前货币配置信息
 * @returns {Object} - { symbol, rate, type }
 */
export function getCurrencyConfig() {
  const quotaDisplayType = localStorage.getItem("quota_display_type") || "USD";
  const statusStr = localStorage.getItem("status");

  let symbol = "$";
  let rate = 1;

  if (quotaDisplayType === "CNY") {
    symbol = "¥";
    try {
      if (statusStr) {
        const s = JSON.parse(statusStr);
        rate = s?.usd_exchange_rate || 7;
      }
    } catch (e) {}
  } else if (quotaDisplayType === "CUSTOM") {
    try {
      if (statusStr) {
        const s = JSON.parse(statusStr);
        symbol = s?.custom_currency_symbol || "¤";
        rate = s?.custom_currency_exchange_rate || 1;
      }
    } catch (e) {}
  }

  return { symbol, rate, type: quotaDisplayType };
}

/**
 * 将美元金额转换为当前选择的货币
 * @param {number} usdAmount - 美元金额
 * @param {number} digits - 小数位数
 * @returns {string} - 格式化后的货币字符串
 */
export function convertUSDToCurrency(usdAmount, digits = 2) {
  const { symbol, rate } = getCurrencyConfig();
  const convertedAmount = usdAmount * rate;
  return symbol + convertedAmount.toFixed(digits);
}

export function renderQuota(quota, digits = 2) {
  let quotaPerUnit = localStorage.getItem("quota_per_unit");
  const quotaDisplayType = localStorage.getItem("quota_display_type") || "USD";
  quotaPerUnit = parseFloat(quotaPerUnit);

  if (quotaDisplayType === "TOKENS") {
    return renderNumber(quota);
  }
  const resultUSD = quota / quotaPerUnit;
  let symbol = "$";
  let value = resultUSD;
  if (quotaDisplayType === "CNY") {
    const statusStr = localStorage.getItem("status");
    let usdRate = 1;
    try {
      if (statusStr) {
        const s = JSON.parse(statusStr);
        usdRate = s?.usd_exchange_rate || 1;
      }
    } catch (e) {}
    value = resultUSD * usdRate;
    symbol = "¥";
  } else if (quotaDisplayType === "CUSTOM") {
    const statusStr = localStorage.getItem("status");
    let symbolCustom = "¤";
    let rate = 1;
    try {
      if (statusStr) {
        const s = JSON.parse(statusStr);
        symbolCustom = s?.custom_currency_symbol || symbolCustom;
        rate = s?.custom_currency_exchange_rate || rate;
      }
    } catch (e) {}
    value = resultUSD * rate;
    symbol = symbolCustom;
  }
  const fixedResult = value.toFixed(digits);
  if (parseFloat(fixedResult) === 0 && quota > 0 && value > 0) {
    const minValue = Math.pow(10, -digits);
    return symbol + minValue.toFixed(digits);
  }

  return symbol + fixedResult;
}

export function renderQuotaWithoutSymbol(quota, digits = 2) {
  let quotaPerUnit = localStorage.getItem("quota_per_unit");
  const quotaDisplayType = localStorage.getItem("quota_display_type") || "USD";
  quotaPerUnit = parseFloat(quotaPerUnit);

  if (quotaDisplayType === "TOKENS") {
    return renderNumber(quota);
  }
  const resultUSD = quota / quotaPerUnit;
  let value = resultUSD;
  if (quotaDisplayType === "CNY") {
    const statusStr = localStorage.getItem("status");
    let usdRate = 1;
    try {
      if (statusStr) {
        const s = JSON.parse(statusStr);
        usdRate = s?.usd_exchange_rate || 1;
      }
    } catch (e) {}
    value = resultUSD * usdRate;
  } else if (quotaDisplayType === "CUSTOM") {
    const statusStr = localStorage.getItem("status");
    let rate = 1;
    try {
      if (statusStr) {
        const s = JSON.parse(statusStr);
        rate = s?.custom_currency_exchange_rate || rate;
      }
    } catch (e) {}
    value = resultUSD * rate;
  }
  const fixedResult = value.toFixed(digits);
  if (parseFloat(fixedResult) === 0 && quota > 0 && value > 0) {
    const minValue = Math.pow(10, -digits);
    return minValue.toFixed(digits);
  }

  return fixedResult;
}
