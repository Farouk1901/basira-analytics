/**
 * Basira Analytics — Pre-written Insights Module
 * Rule-based statistical interpretations (NO AI) — bilingual AR/EN
 */
'use strict';

const Insights = (() => {

  /**
   * Interpret significance from p-value.
   */
  function significance(p, lang = 'en') {
    if (p < 0.001) {
      return lang === 'ar'
        ? '⭐ النتيجة ذات دلالة إحصائية عالية جداً (p < 0.001). يمكنك رفض الفرضية الصفرية بثقة كبيرة.'
        : '⭐ Result is highly statistically significant (p < 0.001). You can confidently reject the null hypothesis.';
    }
    if (p < 0.01) {
      return lang === 'ar'
        ? '✅ النتيجة ذات دلالة إحصائية قوية (p < 0.01).'
        : '✅ Result is strongly statistically significant (p < 0.01).';
    }
    if (p < 0.05) {
      return lang === 'ar'
        ? '✅ النتيجة ذات دلالة إحصائية (p < 0.05). يمكن رفض الفرضية الصفرية.'
        : '✅ Result is statistically significant (p < 0.05). The null hypothesis can be rejected.';
    }
    if (p < 0.1) {
      return lang === 'ar'
        ? '⚠️ النتيجة قريبة من حد الدلالة (0.05 < p < 0.10). قد تحتاج لعينة أكبر.'
        : '⚠️ Result is marginally significant (0.05 < p < 0.10). A larger sample may be needed.';
    }
    return lang === 'ar'
      ? '❌ لا توجد دلالة إحصائية (p ≥ 0.05). لا يمكن رفض الفرضية الصفرية.'
      : '❌ No statistically significant difference found (p ≥ 0.05). The null hypothesis cannot be rejected.';
  }

  /**
   * Interpret effect size for Cohen's d.
   */
  function cohensD(d, lang = 'en') {
    const absD = Math.abs(d);
    let size, sizeAr;
    if (absD >= 0.8) { size = 'large'; sizeAr = 'كبير'; }
    else if (absD >= 0.5) { size = 'medium'; sizeAr = 'متوسط'; }
    else if (absD >= 0.2) { size = 'small'; sizeAr = 'صغير'; }
    else { size = 'negligible'; sizeAr = 'ضئيل'; }

    return lang === 'ar'
      ? `📏 حجم التأثير (Cohen's d = ${absD.toFixed(2)}): تأثير ${sizeAr}.`
      : `📏 Effect size (Cohen's d = ${absD.toFixed(2)}): ${size} effect.`;
  }

  /**
   * Interpret correlation strength.
   */
  function correlationStrength(r, lang = 'en') {
    const absR = Math.abs(r);
    const dir = r > 0 ? (lang === 'ar' ? 'طردية' : 'positive') : (lang === 'ar' ? 'عكسية' : 'negative');

    let strength, strengthAr;
    if (absR >= 0.9) { strength = 'very strong'; strengthAr = 'قوية جداً'; }
    else if (absR >= 0.7) { strength = 'strong'; strengthAr = 'قوية'; }
    else if (absR >= 0.5) { strength = 'moderate'; strengthAr = 'متوسطة'; }
    else if (absR >= 0.3) { strength = 'weak'; strengthAr = 'ضعيفة'; }
    else { strength = 'very weak'; strengthAr = 'ضعيفة جداً'; }

    return lang === 'ar'
      ? `📈 العلاقة ${dir} ${strengthAr} (r = ${r.toFixed(3)}).`
      : `📈 ${strength} ${dir} correlation (r = ${r.toFixed(3)}).`;
  }

  /**
   * Interpret eta-squared for ANOVA.
   */
  function etaSquared(eta2, lang = 'en') {
    let size, sizeAr;
    if (eta2 >= 0.14) { size = 'large'; sizeAr = 'كبير'; }
    else if (eta2 >= 0.06) { size = 'medium'; sizeAr = 'متوسط'; }
    else if (eta2 >= 0.01) { size = 'small'; sizeAr = 'صغير'; }
    else { size = 'negligible'; sizeAr = 'ضئيل'; }

    return lang === 'ar'
      ? `📏 نسبة التباين المُفسَّر (η² = ${eta2.toFixed(3)}): تأثير ${sizeAr}. يفسر ${(eta2 * 100).toFixed(1)}% من التباين.`
      : `📏 Variance explained (η² = ${eta2.toFixed(3)}): ${size} effect. Explains ${(eta2 * 100).toFixed(1)}% of variance.`;
  }

  /**
   * Interpret Cramér's V.
   */
  function cramersV(v, lang = 'en') {
    let size, sizeAr;
    if (v >= 0.5) { size = 'large'; sizeAr = 'كبير'; }
    else if (v >= 0.3) { size = 'medium'; sizeAr = 'متوسط'; }
    else if (v >= 0.1) { size = 'small'; sizeAr = 'صغير'; }
    else { size = 'negligible'; sizeAr = 'ضئيل'; }

    return lang === 'ar'
      ? `📏 مقياس قوة الارتباط (Cramér's V = ${v.toFixed(3)}): ارتباط ${sizeAr}.`
      : `📏 Association strength (Cramér's V = ${v.toFixed(3)}): ${size} association.`;
  }

  /**
   * Descriptive insights.
   */
  function descriptive(stats, lang = 'en') {
    const lines = [];
    if (lang === 'ar') {
      lines.push(`📊 عدد الملاحظات: ${stats.n}`);
      lines.push(`📍 المتوسط الحسابي: ${stats.mean.toFixed(3)}`);
      lines.push(`📍 الوسيط: ${stats.median.toFixed(3)}`);
      if (Math.abs(stats.skewness) > 1) {
        lines.push(`⚠️ التوزيع غير متماثل بشكل ملحوظ (الالتواء = ${stats.skewness.toFixed(3)}).`);
      } else {
        lines.push(`✅ التوزيع قريب من التماثل (الالتواء = ${stats.skewness.toFixed(3)}).`);
      }
    } else {
      lines.push(`📊 Observations: ${stats.n}`);
      lines.push(`📍 Mean: ${stats.mean.toFixed(3)}`);
      lines.push(`📍 Median: ${stats.median.toFixed(3)}`);
      if (Math.abs(stats.skewness) > 1) {
        lines.push(`⚠️ Distribution is notably skewed (skewness = ${stats.skewness.toFixed(3)}).`);
      } else {
        lines.push(`✅ Distribution is approximately symmetric (skewness = ${stats.skewness.toFixed(3)}).`);
      }
    }
    return lines.join('\n');
  }

  /**
   * Generate a test recommendation based on data description.
   */
  function recommendTest(description, lang = 'en') {
    // description: { type: 'compare_means'|'relationship'|'frequency', groups: number, paired: boolean, dataType: 'numeric'|'categorical' }
    const { type, groups, paired, dataType } = description;

    if (type === 'compare_means') {
      if (groups === 1) return lang === 'ar' ? '💡 استخدم اختبار T لعينة واحدة.' : '💡 Use a One-Sample T-Test.';
      if (groups === 2 && paired) return lang === 'ar' ? '💡 استخدم اختبار T للعينات المزدوجة.' : '💡 Use a Paired Samples T-Test.';
      if (groups === 2) return lang === 'ar' ? '💡 استخدم اختبار T للعينات المستقلة.' : '💡 Use an Independent Samples T-Test.';
      if (groups >= 3) return lang === 'ar' ? '💡 استخدم تحليل التباين الأحادي (ANOVA).' : '💡 Use One-Way ANOVA.';
    }
    if (type === 'relationship') {
      if (dataType === 'numeric') return lang === 'ar' ? '💡 استخدم ارتباط بيرسون أو سبيرمان.' : '💡 Use Pearson or Spearman Correlation.';
      if (dataType === 'categorical') return lang === 'ar' ? '💡 استخدم اختبار مربع كاي.' : '💡 Use Chi-Square Test of Independence.';
    }

    return lang === 'ar' ? '💡 حدد نوع التحليل المطلوب لتقديم اقتراح.' : '💡 Specify the analysis type for a recommendation.';
  }

  return { significance, cohensD, correlationStrength, etaSquared, cramersV, descriptive, recommendTest };
})();
