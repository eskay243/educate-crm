import { CourseProgram, Mentor, AuthUser, LMSModule } from "../types/crm";


// Define the comprehensive 12-week Diploma in Financial Trading curriculum based on the scanned PDF
export const financialTradingCourse: CourseProgram = {
  id: 'course-dft-01',
  code: 'DFT-501',
  title: 'Diploma in Financial Trading',
  category: 'Fintech & Financial Markets',
  description: 'VTCT Level 5 Advanced Diploma in Financial Trading — Comprehensive 3-month (12-week / 90-day) institutional professional trading qualification covering market microstructures, multi-asset derivatives (Forex, Equities, Commodities, Fixed Income, Crypto), macroeconomic fundamental analysis, institutional technical analysis (ICT, Wyckoff, Price Action), risk governance, and trading psychology.',
  durationWeeks: 12,
  durationDays: 90,
  durationTrack: '90-Day Diploma',
  tuitionFee: 650000,
  syllabusModules: [
    'Week 1: Introduction & Principles of Financial Trading',
    'Week 2: Market Foundations, Equities & Futures Mechanics',
    'Week 3: Fixed Income, Forex & Commodity Derivatives',
    'Week 4: Options Markets & Derivatives Risk Engineering',
    'Week 5: Cryptocurrency Markets & Digital Asset Trading',
    'Week 6: Spread Betting, CFDs & MetaTrader 4 Execution',
    'Week 7: Macroeconomics, Central Banking & Fundamental Analysis',
    'Week 8: Technical Analysis Core & Japanese Candlesticks',
    'Week 9: Classical Chart Patterns & Market Geometry',
    'Week 10: Quantitative Indicators, Volatility & Institutional Order Flow (ICT)',
    'Week 11: Professional Trading Psychology & Behavioral Finance',
    'Week 12: Risk Governance, Trading Plan & Final Portfolio Capstone'
  ],
  leadInstructor: 'Abiola Adefowope',
  enrolledCount: 0,
  status: 'Active',
  rating: 5.0,
  minimumRequiredHours: 25,
  nsqfLevel: 'VTCT Level 5 Advanced Diploma (Ofqual Regulated)',
  nitdaTrack: 'Fintech & Capital Markets Trading Specialist Track',
  theoryHours: 90,
  practicalHours: 180,
  learningGuidelinesSummary: 'Accredited by VTCT (UK) Level 5 standard (270 Guided Learning Hours, 309 Total Qualification Time). Requires 25 verified trade journal entries, 15 modular essay submissions, minimum 3 weekly IQA review audits, and final trading plan submission.'
};

export const mentorAbiola: Mentor = {
  id: 'men-abiola-adefowope',
  mentorCode: 'MN-5001',
  name: 'Abiola Adefowope',
  email: 'eskay243@gmail.com',
  phone: '+234 803 000 2430',
  password: 'password123',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  role: 'Lead Faculty Mentor & Financial Trading Director',
  department: 'Financial Markets & Trading',
  expertise: [
    'Financial Markets & Trading',
    'Derivatives, Futures & Options',
    'Macroeconomics & Central Banking',
    'Technical Analysis & ICT Order Flow',
    'Risk Governance & Portfolio Management',
    'Cryptocurrency Markets'
  ],
  courses: ['Diploma in Financial Trading'],
  track: 'Financial Markets & Trading',
  monthlyBasePay: 750000,
  maxCapacity: 35,
  activeMentees: 0,
  rating: 5.0,
  sessionsCount: 0,
  commissionRate: 37,
  pendingPayout: 0,
  payoutStatus: 'Completed',
  status: 'Active',
  isActive: true,
  lecturedHours: 0,
  minimumRequiredHours: 25,
  joinedDate: '2026-10-06',
  bio: 'Lead Faculty Mentor and Director of Financial Trading. Specializes in multi-asset portfolio management, macroeconomic policy forecasting, algorithmic execution, and VTCT Level 5 diploma accreditation governance.',
  bankName: 'Guaranty Trust Bank (GTBank)',
  accountNumber: '0123456789',
  accountName: 'Abiola Adefowope',
  bankCode: '058',
  bankVerified: true,
  isAccountVerified: true,
  accountVerificationSource: 'Verified via CBN NUBAN Tier 3 Faculty KYC',
  accountVerifiedAt: new Date().toISOString()
};

export const staffUserAbiola: AuthUser = {
  id: 'user-mentor-abiola',
  name: 'Abiola Adefowope',
  email: 'eskay243@gmail.com',
  phone: '+234 803 000 2430',
  role: 'mentor',
  roleTitle: 'Lead Faculty Mentor & Financial Trading Director',
  department: 'Financial Markets & Trading',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  mentorId: 'men-abiola-adefowope',
  isActive: true,
  status: 'Active',
  password: 'password123'
};

// 12 Weekly Modules with all items from the PDF and curated YouTube educational video tutorials
export const financialTradingModules: LMSModule[] = [
  // ==========================================
  // MODULE 1: WEEK 1
  // ==========================================
  {
    id: 'mod-dft-01',
    courseTitle: 'Diploma in Financial Trading',
    title: 'Module 1 (Week 1): Getting Started & Principles of Financial Trading',
    description: 'Establish foundational market literacy, trader responsibilities, institutional market participants, and demo platform setup (PDF Introduction + Unit 1).',
    order: 1,
    durationTrack: '90-Day Diploma',
    durationDays: 90,
    nsqfLevel: 'VTCT Level 5 Advanced Diploma',
    nitdaStandardCode: 'VTCT-DFT-MOD-01',
    theoryHours: 8,
    practicalHours: 15,
    learningGuideline: {
      prerequisites: ['Basic numeracy and English literacy', 'Personal computer with stable internet connection'],
      competencyOutcome: 'Demonstrate comprehensive understanding of financial markets taxonomy, the role of a financial trader, and initialize institutional trade logging protocols.',
      expectedDeliverables: [
        'Institutional TradingView & Broker Demo Account Configuration',
        'Submission of First 5 Trading Journal Portfolio Entries',
        'Submission of Essays 1-15 Draft to avik@educate2trade.com'
      ],
      dayRange: 'Days 1 - 7 (Week 1)',
      theoryHours: 8,
      practicalHours: 15
    },
    lessons: [
      {
        id: 'les-dft-1-1',
        moduleId: 'mod-dft-01',
        title: 'Welcome to the Level 5 Diploma - What to Expect & Course Structure',
        durationMinutes: 45,
        type: 'video',
        dayNumber: 1,
        videoUrl: 'https://www.youtube.com/embed/p7HKvqZ_Jys',
        contentMarkdown: `### Learning Objectives\n- Understand VTCT Level 5 qualification requirements, grading criteria, and learner commitments.\n- Structure daily study sessions (Watch, Read & Write, Practise, Review).\n- Establish direct submission channels for essays and trading portfolios.`,
        learningObjectives: ['Review VTCT syllabus roadmap', 'Establish study timetable of 22.5 hrs/week', 'Prepare portfolio submission folders'],
        practicalLabTask: 'Download the course study checklist and schedule daily 2-hour study blocks.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-1-2',
        moduleId: 'mod-dft-01',
        title: 'How to Get the Most From This Course, Study Schedule & Time Commitment',
        durationMinutes: 50,
        type: 'video',
        dayNumber: 2,
        videoUrl: 'https://www.youtube.com/embed/fTTGALaRZoc',
        contentMarkdown: `### Learning Objectives\n- Adopt professional study and note-taking habits in financial trading.\n- Allocate guided learning hours across theory lectures, chart analysis, and written essays.\n- Engage with the peer trading community and weekly mentor check-ins.`,
        learningObjectives: ['Develop note-taking discipline', 'Map out 3-month milestone dates', 'Join student trading community'],
        practicalLabTask: 'Create your digital trading notebook and journal directory.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-1-3',
        moduleId: 'mod-dft-01',
        title: 'Setting Up Your Demo Trading Account & TradingView Platform',
        durationMinutes: 60,
        type: 'lab',
        dayNumber: 3,
        videoUrl: 'https://www.youtube.com/embed/jZf6N8a29H4',
        contentMarkdown: `### Learning Objectives\n- Configure multi-asset charting layouts on TradingView.\n- Open and verify an institutional demo brokerage account (MT4/MT5 or cTrader).\n- Configure risk parameters and default position sizing.`,
        learningObjectives: ['Complete demo broker registration', 'Set up multi-timeframe charts', 'Configure watchlist with FX, Indices and Gold'],
        practicalLabTask: 'Configure a £50,000 / $50,000 demo account and take a verification screenshot for your portfolio.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-1-4',
        moduleId: 'mod-dft-01',
        title: 'Unit 1: Introduction, Essay Overview, Timeline and Portfolio Start',
        durationMinutes: 60,
        type: 'reading',
        dayNumber: 4,
        videoUrl: 'https://www.youtube.com/embed/nL3b0LgO3eU',
        contentMarkdown: `### Learning Objectives\n- Review essay prompts 1 through 15 for Unit 1.\n- Understand the VTCT assessment rubric for academic essays.\n- Initialize your 25-entry portfolio journal.`,
        learningObjectives: ['Understand essay assessment criteria', 'Draft essay outlines for Unit 1', 'Initialize trade entry log template'],
        practicalLabTask: 'Complete and document Trade Entry #1 in your trading journal with entry price, stop loss, and market rationale.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-1-5',
        moduleId: 'mod-dft-01',
        title: 'Role of a Financial Trader & Institutional Market Participants',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 5,
        videoUrl: 'https://www.youtube.com/embed/48pmW1G8pYc',
        contentMarkdown: `### Learning Objectives\n- Analyze the functions of investment banks, mutual funds, hedge funds, sovereign wealth funds, and market makers.\n- Contrast proprietary retail trading with buy-side and sell-side institutional desks.\n- Understand liquidity provision, bid-ask spread mechanics, and market makers.`,
        learningObjectives: ['Identify Tier-1 investment bank operations', 'Understand liquidity provision', 'Analyze arbitrage strategies'],
        practicalLabTask: 'Write a 300-word comparative analysis on retail vs institutional liquidity.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-1-6',
        moduleId: 'mod-dft-01',
        title: 'News Trading, Macro Risk Management & Friday IQA Audit',
        durationMinutes: 75,
        type: 'lab',
        dayNumber: 7,
        videoUrl: 'https://www.youtube.com/embed/2uV_c6mY1iU',
        contentMarkdown: `### Learning Objectives\n- Understand how macroeconomic news releases generate market volatility.\n- Avoid common high-slippage execution pitfalls during tier-1 data prints.\n- Complete Week 1 milestone: 5 portfolio entries submitted and Friday IQA audit logged.`,
        learningObjectives: ['Analyze news volatility spikes', 'Execute first 5 portfolio demo trades', 'Pass Friday IQA questionnaire audit'],
        practicalLabTask: 'Audit and package your first 5 completed portfolio trade entries and submit to bradley.goldberg@educate2trade.com.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      }
    ]
  },

  // ==========================================
  // MODULE 2: WEEK 2
  // ==========================================
  {
    id: 'mod-dft-02',
    courseTitle: 'Diploma in Financial Trading',
    title: 'Module 2 (Week 2): Market Foundations, Equities & Futures Mechanics',
    description: 'Explore global financial market taxonomy, origins of futures exchanges, contract specifications, and equity valuation models (Unit 2 Part 1).',
    order: 2,
    durationTrack: '90-Day Diploma',
    durationDays: 90,
    nsqfLevel: 'VTCT Level 5 Advanced Diploma',
    nitdaStandardCode: 'VTCT-DFT-MOD-02',
    theoryHours: 8,
    practicalHours: 15,
    learningGuideline: {
      prerequisites: ['Module 1 completed', 'Active TradingView & demo account'],
      competencyOutcome: 'Explain the mechanics of exchange-traded futures, equity shareholding, and spread types with institutional precision.',
      expectedDeliverables: [
        'Comparative Analysis of Major Global Exchanges (CME, ICE, Eurex, LSE)',
        'Trade Journal Entries #6 to #8 (Equity & Futures Contracts)'
      ],
      dayRange: 'Days 8 - 14 (Week 2)',
      theoryHours: 8,
      practicalHours: 15
    },
    lessons: [
      {
        id: 'les-dft-2-1',
        moduleId: 'mod-dft-02',
        title: 'Types of Financial Markets & Exchange Infrastructure',
        durationMinutes: 50,
        type: 'video',
        dayNumber: 8,
        videoUrl: 'https://www.youtube.com/embed/zS6bB5gYxHQ',
        contentMarkdown: `### Learning Objectives\n- Differentiate between exchange-traded and over-the-counter (OTC) financial markets.\n- Understand central counterparty clearing (CCP) and margin settlement.\n- Study the role of clearing houses in mitigating systemic counterparty default risk.`,
        learningObjectives: ['Compare OTC vs Centralized Exchanges', 'Understand CCP clearing mechanics', 'Analyze auction vs quote-driven markets'],
        practicalLabTask: 'Document the regulatory and clearing structures of CME Group and the London Stock Exchange.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-2-2',
        moduleId: 'mod-dft-02',
        title: 'The Historical Origins and Mechanics of the Futures Market',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 9,
        videoUrl: 'https://www.youtube.com/embed/WJ6U9n1iX3c',
        contentMarkdown: `### Learning Objectives\n- Trace the evolution of futures contracts from agricultural hedging to financial derivatives.\n- Understand contract specifications: tick size, tick value, contract multiplier, and expiration cycles.\n- Calculate contract notional value and initial margin requirements.`,
        learningObjectives: ['Deconstruct futures contract specifications', 'Calculate tick values across E-mini S&P and Crude Oil', 'Understand physical vs cash settlement'],
        practicalLabTask: 'Calculate the notional value and margin requirement for 1 contract of Micro E-mini S&P 500 (MES).',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-2-3',
        moduleId: 'mod-dft-02',
        title: 'Types of Futures Trading & Speculative vs Hedging Operations',
        durationMinutes: 55,
        type: 'video',
        dayNumber: 11,
        videoUrl: 'https://www.youtube.com/embed/5F_1wE6Yv54',
        contentMarkdown: `### Learning Objectives\n- Distinguish commercial hedgers from non-commercial speculative funds.\n- Interpret the CFTC Commitments of Traders (COT) report.\n- Execute synthetic hedges against physical underlying exposure.`,
        learningObjectives: ['Analyze commercial vs speculative market positioning', 'Read COT reports', 'Structure portfolio delta hedges'],
        practicalLabTask: 'Analyze the latest COT report for Gold futures and journal potential institutional bias.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-2-4',
        moduleId: 'mod-dft-02',
        title: 'Types of Spreads: Calendar Spreads, Inter-commodity & Arbitrage',
        durationMinutes: 50,
        type: 'video',
        dayNumber: 12,
        videoUrl: 'https://www.youtube.com/embed/48pmW1G8pYc',
        contentMarkdown: `### Learning Objectives\n- Understand calendar (intra-market) spreads across contract delivery months.\n- Analyze inter-commodity spreads (e.g. Crack spread, Spark spread, Gold/Silver ratio).\n- Identify mean-reverting spread characteristics and lower volatility profiles.`,
        learningObjectives: ['Master calendar spreads', 'Analyze cross-asset ratios', 'Execute pair trades on demo platform'],
        practicalLabTask: 'Chart the Gold/Silver ratio (XAU/XAG) on TradingView and identify key historical turning points.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-2-5',
        moduleId: 'mod-dft-02',
        title: 'What are Shares? Equity Valuations, Dividends & Corporate Actions',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 14,
        videoUrl: 'https://www.youtube.com/embed/p7HKvqZ_Jys',
        contentMarkdown: `### Learning Objectives\n- Understand common vs preferred stock, voting rights, and equity capital raising.\n- Calculate price-to-earnings (P/E), EV/EBITDA, and dividend yield ratios.\n- Analyze the impact of stock splits, buybacks, and dividend ex-dates on asset pricing.`,
        learningObjectives: ['Master equity fundamentals', 'Calculate valuation multiples', 'Account for corporate action adjustments'],
        practicalLabTask: 'Execute and journal a demo trade on an equity constituent of the FTSE 100 or S&P 500.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      }
    ]
  },

  // ==========================================
  // MODULE 3: WEEK 3
  // ==========================================
  {
    id: 'mod-dft-03',
    courseTitle: 'Diploma in Financial Trading',
    title: 'Module 3 (Week 3): Fixed Income, Forex & Commodity Derivatives',
    description: 'Master sovereign debt instruments, yield curves, STIRS interest rate futures, foreign exchange architecture, and global commodity complexes (Unit 2 Part 2).',
    order: 3,
    durationTrack: '90-Day Diploma',
    durationDays: 90,
    nsqfLevel: 'VTCT Level 5 Advanced Diploma',
    nitdaStandardCode: 'VTCT-DFT-MOD-03',
    theoryHours: 8,
    practicalHours: 15,
    learningGuideline: {
      prerequisites: ['Module 2 completed', 'Understanding of futures contract specifications'],
      competencyOutcome: 'Analyze the macroeconomic interplay between bond yields, interest rate futures, forex currency pairs, and commodity price inflation.',
      expectedDeliverables: [
        'Submission of Unit 2 Bond Essay & STIRS Analysis',
        'Cumulative 15 Portfolio Trade Entries Audit at Day 15'
      ],
      dayRange: 'Days 15 - 21 (Week 3)',
      theoryHours: 8,
      practicalHours: 15
    },
    lessons: [
      {
        id: 'les-dft-3-1',
        moduleId: 'mod-dft-03',
        title: 'Trading Government Bonds, Price vs Yield & Bond Essay Requirements',
        durationMinutes: 65,
        type: 'video',
        dayNumber: 15,
        videoUrl: 'https://www.youtube.com/embed/IuyejHOGCro',
        contentMarkdown: `### Learning Objectives\n- Understand sovereign debt markets: US Treasuries, UK Gilts, German Bunds, and Japanese JGBs.\n- Master the inverse relationship between bond prices and bond yields.\n- Interpret the yield curve (normal, flat, inverted) as a leading recession barometer.`,
        learningObjectives: ['Understand coupon rates and yield to maturity (YTM)', 'Analyze 2Y vs 10Y yield curve inversion', 'Complete Bond Essay requirements'],
        practicalLabTask: 'Draft the 1,000-word Unit 2 Bond Essay addressing price/yield mechanics and submit to avik@educate2trade.com.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-3-2',
        moduleId: 'mod-dft-03',
        title: 'STIRS Futures (Short-Term Interest Rate Spreads) & Central Bank Projections',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 16,
        videoUrl: 'https://www.youtube.com/embed/Z0oYvKqH2wM',
        contentMarkdown: `### Learning Objectives\n- Understand Short-Term Interest Rate (STIRS) contracts: SOFR, SONIA, and Euribor futures.\n- Calculate implied policy rate expectations from STIRS pricing (100 minus price).\n- Gauge market-implied rate cuts or hikes before central bank announcements.`,
        learningObjectives: ['Price STIRS futures contracts', 'Calculate market rate expectations', 'Complete STIRS portfolio boost assessment'],
        practicalLabTask: 'Calculate implied 3-month interest rate expectations from current SOFR futures contract prices.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-3-3',
        moduleId: 'mod-dft-03',
        title: 'What is Forex? Currency Pairs, Crosses & FX Futures Architecture',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 18,
        videoUrl: 'https://www.youtube.com/embed/F4qH1rAODoQ',
        contentMarkdown: `### Learning Objectives\n- Understand the $7.5 trillion/day OTC Forex market structure.\n- Differentiate base currency from quote currency across majors, minors, and exotics.\n- Calculate pips, lots, pip values, and leverage across EUR/USD, GBP/USD, and USD/JPY.`,
        learningObjectives: ['Calculate pip values and lot sizing', 'Understand currency triangular arbitrage', 'Compare Spot FX with CME FX futures'],
        practicalLabTask: 'Execute and journal 2 demo forex trades adhering to strict 1% account risk.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-3-4',
        moduleId: 'mod-dft-03',
        title: 'Commodities Futures: Energy, Precious Metals, Agriculture & Rolling',
        durationMinutes: 55,
        type: 'video',
        dayNumber: 19,
        videoUrl: 'https://www.youtube.com/embed/yQd6m5C57S8',
        contentMarkdown: `### Learning Objectives\n- Understand physical commodity market fundamentals (supply, demand, storage, transport).\n- Master WTI Crude Oil, Brent, Natural Gas, Gold, Silver, and Copper futures.\n- Understand contango vs backwardation and the cost of rolling expiring futures contracts.`,
        learningObjectives: ['Differentiate backwardation from contango', 'Analyze OPEC+ and geopolitical supply shocks', 'Complete commodity futures assessment'],
        practicalLabTask: 'Chart WTI Crude Oil futures curve and document whether the market is in contango or backwardation.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-3-5',
        moduleId: 'mod-dft-03',
        title: 'Index Futures & Milestone Review: 15 Portfolio Entries Audit',
        durationMinutes: 70,
        type: 'lab',
        dayNumber: 21,
        videoUrl: 'https://www.youtube.com/embed/5F_1wE6Yv54',
        contentMarkdown: `### Learning Objectives\n- Understand stock index futures: S&P 500 (ES), Nasdaq (NQ), Dow (YM), and FTSE 100 (Z).\n- Use index futures to hedge diversified equity portfolios.\n- Conduct Day 15 milestone audit: verify 15 complete trade entries in trading journal.`,
        learningObjectives: ['Calculate index contract multipliers', 'Hedge long equity exposure with short index futures', 'Pass Program Officer Day 15 audit'],
        practicalLabTask: 'Submit cumulative 15 trade portfolio entries to bradley.goldberg@educate2trade.com for Program Officer verification.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      }
    ]
  },

  // ==========================================
  // MODULE 4: WEEK 4
  // ==========================================
  {
    id: 'mod-dft-04',
    courseTitle: 'Diploma in Financial Trading',
    title: 'Module 4 (Week 4): Options Markets & Derivatives Risk Engineering',
    description: 'Deconstruct financial options, pricing models, options Greeks, expiration dynamics, and institutional hedging structures (Unit 2 Part 3).',
    order: 4,
    durationTrack: '90-Day Diploma',
    durationDays: 90,
    nsqfLevel: 'VTCT Level 5 Advanced Diploma',
    nitdaStandardCode: 'VTCT-DFT-MOD-04',
    theoryHours: 8,
    practicalHours: 15,
    learningGuideline: {
      prerequisites: ['Module 3 completed', 'Solid grasp of futures pricing'],
      competencyOutcome: 'Demonstrate technical mastery over options pricing, Greek sensitivities, and multi-leg risk mitigation strategies.',
      expectedDeliverables: [
        'Submission of All Unit 1-2 Essay Drafts to avik@educate2trade.com',
        'Options Risk Simulation Spreadsheet (Delta/Theta Profile)'
      ],
      dayRange: 'Days 22 - 28 (Week 4)',
      theoryHours: 8,
      practicalHours: 15
    },
    lessons: [
      {
        id: 'les-dft-4-1',
        moduleId: 'mod-dft-04',
        title: 'Introduction to Financial Options: Calls, Puts & Premium Valuation',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 22,
        videoUrl: 'https://www.youtube.com/embed/SD7sw0bf1ms',
        contentMarkdown: `### Learning Objectives\n- Understand call and put options rights vs obligations.\n- Deconstruct option premium into intrinsic value and extrinsic (time) value.\n- Identify In-The-Money (ITM), At-The-Money (ATM), and Out-Of-The-Money (OTM) states.`,
        learningObjectives: ['Define buyers rights vs sellers obligations', 'Calculate intrinsic vs extrinsic option values', 'Understand strike price selection'],
        practicalLabTask: 'Calculate the intrinsic and extrinsic value of an Apple (AAPL) call option at varying market prices.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-4-2',
        moduleId: 'mod-dft-04',
        title: 'Options Greeks: Delta, Gamma, Theta, Vega & Rho Sensitivity Models',
        durationMinutes: 65,
        type: 'video',
        dayNumber: 24,
        videoUrl: 'https://www.youtube.com/embed/zH3E5o1uT7I',
        contentMarkdown: `### Learning Objectives\n- Master Delta (directional exposure and hedge ratio).\n- Analyze Gamma (rate of delta acceleration).\n- Master Theta (time decay curve) and Vega (implied volatility sensitivity).\n- Understand Rho (interest rate sensitivity).`,
        learningObjectives: ['Calculate delta-equivalent portfolio exposure', 'Analyze theta decay acceleration near expiry', 'Model implied volatility expansion/contraction'],
        practicalLabTask: 'Plot the theta decay curve of an ATM option over its final 30 days before expiration.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-4-3',
        moduleId: 'mod-dft-04',
        title: 'Option Expiry Dynamics, Pin Risk & Options Essay Preparation',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 25,
        videoUrl: 'https://www.youtube.com/embed/6iS0vYgYF5E',
        contentMarkdown: `### Learning Objectives\n- Understand the mechanics of options expiration (OpEx) cycles.\n- Analyze pin risk and max pain theory in equity indices.\n- Understand assignment procedures and cash settlement on index options.`,
        learningObjectives: ['Manage expiry week volatility', 'Mitigate unexpected weekend assignment risk', 'Complete options assessment quiz'],
        practicalLabTask: 'Write a 400-word analysis on managing assignment risk into triple witching expiration.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-4-4',
        moduleId: 'mod-dft-04',
        title: 'Derivatives Essay & Milestone: End of Week 4 All Essay Drafts Lock',
        durationMinutes: 70,
        type: 'reading',
        dayNumber: 28,
        videoUrl: 'https://www.youtube.com/embed/SD7sw0bf1ms',
        contentMarkdown: `### Learning Objectives\n- Finalize written drafts for all academic essays covering Units 1 and 2.\n- Review portfolio guidelines and ensure risk management notes are complete.\n- Milestone Gate: Submit all essay drafts to avik@educate2trade.com for Program Officer audit.`,
        learningObjectives: ['Complete all modular essay drafts', 'Undergo Program Officer Week 4 audit gate', 'Ensure compliance with VTCT Level 5 rubric'],
        practicalLabTask: 'Compile and submit your complete essay draft document to avik@educate2trade.com for formal Program Officer review.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      }
    ]
  },

  // ==========================================
  // MODULE 5: WEEK 5
  // ==========================================
  {
    id: 'mod-dft-05',
    courseTitle: 'Diploma in Financial Trading',
    title: 'Module 5 (Week 5): Cryptocurrency Markets & Digital Asset Trading',
    description: 'Analyze digital assets, blockchain mechanics, crypto tokenomics, perpetual swaps, and risk mitigation protocols (Unit 3).',
    order: 5,
    durationTrack: '90-Day Diploma',
    durationDays: 90,
    nsqfLevel: 'VTCT Level 5 Advanced Diploma',
    nitdaStandardCode: 'VTCT-DFT-MOD-05',
    theoryHours: 7.5,
    practicalHours: 15,
    learningGuideline: {
      prerequisites: ['Modules 1-4 completed', 'Understanding of multi-asset order execution'],
      competencyOutcome: 'Evaluate cryptocurrency market cycles, perform on-chain and tokenomic due diligence, and navigate digital asset liquidity traps.',
      expectedDeliverables: [
        'Submission of Unit 3 Crypto Essay',
        'Attainment of 25 Verified Portfolio Entries Target (Day 25 Milestone)'
      ],
      dayRange: 'Days 29 - 35 (Week 5)',
      theoryHours: 7.5,
      practicalHours: 15
    },
    lessons: [
      {
        id: 'les-dft-5-1',
        moduleId: 'mod-dft-05',
        title: 'What are Cryptocurrencies? Blockchain, Bitcoin & Market Infrastructure',
        durationMinutes: 55,
        type: 'video',
        dayNumber: 29,
        videoUrl: 'https://www.youtube.com/embed/bBC-nXj3Ng4',
        contentMarkdown: `### Learning Objectives\n- Understand distributed ledger technology, consensus mechanisms (PoW vs PoS), and smart contracts.\n- Analyze Bitcoin as digital gold vs Ethereum as decentralized computing infrastructure.\n- Understand centralized exchanges (CEX) vs decentralized exchanges (DEX).`,
        learningObjectives: ['Deconstruct blockchain mechanics', 'Understand crypto custody and cold storage', 'Compare spot crypto vs derivatives'],
        practicalLabTask: 'Track on-chain transaction volumes and hash rate trends using public explorers.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-5-2',
        moduleId: 'mod-dft-05',
        title: 'Different Ways to Trade Crypto: Spot, Perpetual Swaps & Funding Rates',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 31,
        videoUrl: 'https://www.youtube.com/embed/M8Vp1Y_a9Wc',
        contentMarkdown: `### Learning Objectives\n- Understand perpetual futures contracts and the 8-hour funding rate mechanism.\n- Analyze how positive/negative funding rates signal market leverage bias.\n- Execute synthetic basis arbitrage between spot and dated futures.`,
        learningObjectives: ['Calculate perpetual funding rate payments', 'Analyze open interest and liquidation heatmaps', 'Manage extreme crypto volatility'],
        practicalLabTask: 'Calculate the annualized yield of an institutional cash-and-carry basis trade on BTC.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-5-3',
        moduleId: 'mod-dft-05',
        title: 'How to Research Tokenomics & Dangers of Low-Cap Altcoins',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 32,
        videoUrl: 'https://www.youtube.com/embed/3Q9K2Sj4u7A',
        contentMarkdown: `### Learning Objectives\n- Perform fundamental due diligence on crypto tokenomics (token supply, vesting schedules, inflation rate).\n- Identify red flags: insider unlock cliffs, wash trading, and low-float liquidity traps.\n- Differentiate high-conviction utility tokens from speculative meme tokens.`,
        learningObjectives: ['Audit token vesting schedules', 'Detect liquidity pool drainage risks', 'Assess smart contract counterparty risk'],
        practicalLabTask: 'Perform a comprehensive tokenomics audit on a selected top-50 crypto asset.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-5-4',
        moduleId: 'mod-dft-05',
        title: 'Crypto Essay & Day 25 Milestone: 25 Portfolio Entries Completion',
        durationMinutes: 75,
        type: 'lab',
        dayNumber: 35,
        videoUrl: 'https://www.youtube.com/embed/M8Vp1Y_a9Wc',
        contentMarkdown: `### Learning Objectives\n- Complete Unit 3 Cryptocurrency Essay answering key regulatory and market risk prompts.\n- Achieve the official target of **25 completed trade portfolio entries** by Day 25.\n- Submit completed portfolio document to bradley.goldberg@educate2trade.com for formal audit.`,
        learningObjectives: ['Complete Unit 3 Essay', 'Attain full 25-trade portfolio target', 'Undergo Program Officer Day 25 verification'],
        practicalLabTask: 'Submit your 25 verified trade entries with full chart markup screenshots to the assessment team.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      }
    ]
  },

  // ==========================================
  // MODULE 6: WEEK 6
  // ==========================================
  {
    id: 'mod-dft-06',
    courseTitle: 'Diploma in Financial Trading',
    title: 'Module 6 (Week 6): Spread Betting, CFDs & MetaTrader 4 Execution',
    description: 'Explore retail derivatives infrastructure, Contracts for Difference, spread betting tax considerations, and comprehensive MT4/MT5 platform mastery (Units 4 & 5).',
    order: 6,
    durationTrack: '90-Day Diploma',
    durationDays: 90,
    nsqfLevel: 'VTCT Level 5 Advanced Diploma',
    nitdaStandardCode: 'VTCT-DFT-MOD-06',
    theoryHours: 7.5,
    practicalHours: 15,
    learningGuideline: {
      prerequisites: ['Modules 1-5 completed', '25 Portfolio entries established'],
      competencyOutcome: 'Execute precise order types on MetaTrader 4, calculate margin requirements, and manage risk to prevent margin calls.',
      expectedDeliverables: [
        'MT4 Customized Workspace & Hotkey Profile Configuration',
        'Margin & Leverage Stress-Test Simulation'
      ],
      dayRange: 'Days 36 - 42 (Week 6)',
      theoryHours: 7.5,
      practicalHours: 15
    },
    lessons: [
      {
        id: 'les-dft-6-1',
        moduleId: 'mod-dft-06',
        title: 'Spread Betting vs Contracts for Difference (CFDs) Explained',
        durationMinutes: 55,
        type: 'video',
        dayNumber: 36,
        videoUrl: 'https://www.youtube.com/embed/F_m9qM6bY3M',
        contentMarkdown: `### Learning Objectives\n- Understand financial spread betting (pound per point stake sizing).\n- Analyze CFDs (contracts representing price differential without asset ownership).\n- Compare overnight swap financing rates and regulatory retail leverage limits (ESMA/FCA).`,
        learningObjectives: ['Calculate stake sizing in spread betting', 'Analyze CFD financing charges', 'Compare Direct Market Access vs Market Maker brokers'],
        practicalLabTask: 'Calculate financing charges for holding a 1-lot FTSE 100 CFD position over a 30-day period.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-6-2',
        moduleId: 'mod-dft-06',
        title: 'MetaTrader 4 (MT4) Platform Walkthrough & Execution Mechanics',
        durationMinutes: 65,
        type: 'lab',
        dayNumber: 38,
        videoUrl: 'https://www.youtube.com/embed/U2qL4eB2zVo',
        contentMarkdown: `### Learning Objectives\n- Master MetaTrader 4/5 interface navigation, market watch, navigator, and terminal.\n- Configure custom chart templates, period separators, and drawing tools.\n- Place one-click market orders, pending orders, and trailing stop triggers.`,
        learningObjectives: ['Master MT4 order placement', 'Implement automated trailing stops', 'Configure multi-chart workspace profiles'],
        practicalLabTask: 'Set up an MT4 workspace profile with 4 linked charts (M15, H1, H4, D1) and save the template.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-6-3',
        moduleId: 'mod-dft-06',
        title: 'Executing Orders, Stop Losses, Limit Orders & Slippage Management',
        durationMinutes: 55,
        type: 'video',
        dayNumber: 39,
        videoUrl: 'https://www.youtube.com/embed/zK6r0Q4M1s4',
        contentMarkdown: `### Learning Objectives\n- Differentiate Buy Limit vs Buy Stop; Sell Limit vs Sell Stop.\n- Understand guaranteed stop loss orders (GSLO) vs standard non-guaranteed stops.\n- Analyze execution slippage, latency, and dark liquidity pools.`,
        learningObjectives: ['Implement multi-level take profit orders', 'Minimize execution slippage', 'Set up time-based trade cancellation'],
        practicalLabTask: 'Place and manage 3 pending limit orders on your MT4 demo account.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-6-4',
        moduleId: 'mod-dft-06',
        title: 'Understanding Leverage, Margin Levels & Avoiding Margin Calls',
        durationMinutes: 65,
        type: 'video',
        dayNumber: 42,
        videoUrl: 'https://www.youtube.com/embed/P3uM7rL_K3s',
        contentMarkdown: `### Learning Objectives\n- Calculate usable margin, used margin, and margin level percentage.\n- Understand the mathematics of leverage (1:30 vs 1:100 vs 1:500).\n- Analyze stop-out thresholds and broker liquidation cascades during volatile gap openings.`,
        learningObjectives: ['Calculate margin level formulas', 'Model worst-case gap scenarios', 'Pass Unit 5 Execution & Leverage Assessment'],
        practicalLabTask: 'Complete the Unit 5 Assessment on executing orders and leverage.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      }
    ]
  },

  // ==========================================
  // MODULE 7: WEEK 7
  // ==========================================
  {
    id: 'mod-dft-07',
    courseTitle: 'Diploma in Financial Trading',
    title: 'Module 7 (Week 7): Macroeconomics, Central Banking & Fundamental Analysis',
    description: 'Master global macroeconomic drivers, monetary policy, central bank communications, and trading high-impact economic calendar events (Unit 6).',
    order: 7,
    durationTrack: '90-Day Diploma',
    durationDays: 90,
    nsqfLevel: 'VTCT Level 5 Advanced Diploma',
    nitdaStandardCode: 'VTCT-DFT-MOD-07',
    theoryHours: 8,
    practicalHours: 15,
    learningGuideline: {
      prerequisites: ['Modules 1-6 completed', 'Understanding of fixed income & currency markets'],
      competencyOutcome: 'Forecast asset price direction based on macroeconomic data surprises, central bank forward guidance, and inflation trajectories.',
      expectedDeliverables: [
        'Macroeconomic Event Trade Plan (FOMC or Non-Farm Payrolls)',
        'Unit 6 Macro & Microeconomic Analysis Assessment'
      ],
      dayRange: 'Days 43 - 49 (Week 7)',
      theoryHours: 8,
      practicalHours: 15
    },
    lessons: [
      {
        id: 'les-dft-7-1',
        moduleId: 'mod-dft-07',
        title: 'What is Fundamental Analysis & Why Macroeconomics Moves Markets',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 43,
        videoUrl: 'https://www.youtube.com/embed/p3c2pZ5uW_4',
        contentMarkdown: `### Learning Objectives\n- Understand why fundamental macroeconomic data drives long-term asset valuations.\n- Analyze the economic cycle (expansion, peak, contraction, trough) and asset rotation.\n- Correlate interest rate differentials with sovereign currency strength.`,
        learningObjectives: ['Analyze business cycle stages', 'Track asset rotation from equities to bonds', 'Understand capital flight mechanics'],
        practicalLabTask: 'Identify the current stage of the global economic cycle and document optimal sector allocations.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-7-2',
        moduleId: 'mod-dft-07',
        title: 'Global Central Banks: Federal Reserve, ECB, BOE & Monetary Policy',
        durationMinutes: 65,
        type: 'video',
        dayNumber: 45,
        videoUrl: 'https://www.youtube.com/embed/5bY2s4Q8i1w',
        contentMarkdown: `### Learning Objectives\n- Understand the dual mandate of the Federal Reserve (price stability & maximum employment).\n- Compare central bank balance sheets, repo markets, and quantitative easing/tightening.\n- Interpret central bank dot plots, policy statements, and hawkish vs dovish sentiment.`,
        learningObjectives: ['Analyze Federal Reserve dot plots', 'Assess ECB and Bank of England policy divergences', 'Identify hawkish vs dovish statement cues'],
        practicalLabTask: 'Read the latest FOMC meeting statement and highlight 3 key forward guidance shifts.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-7-3',
        moduleId: 'mod-dft-07',
        title: 'Trading the Economic Calendar: FOMC Press Conferences & Non-Farm Payrolls (NFP)',
        durationMinutes: 70,
        type: 'video',
        dayNumber: 46,
        videoUrl: 'https://www.youtube.com/embed/2uV_c6mY1iU',
        contentMarkdown: `### Learning Objectives\n- Understand consensus expectations vs actual prints in economic calendar data.\n- Master the Non-Farm Payrolls (NFP) report components: headline jobs, unemployment rate, and average hourly earnings.\n- Formulate pre-news, breakout, and post-news retracement execution plans.`,
        learningObjectives: ['Calculate deviation indices for economic data', 'Formulate NFP breakout strategies', 'Manage spreads during news volatility'],
        practicalLabTask: 'Construct a pre-event trading plan for an upcoming NFP release with defined scenarios.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-7-4',
        moduleId: 'mod-dft-07',
        title: 'Corporate Earnings, Newsfeeds, Twitter & Unit 6 Assessment',
        durationMinutes: 65,
        type: 'reading',
        dayNumber: 49,
        videoUrl: 'https://www.youtube.com/embed/7Vz1mY_q5S0',
        contentMarkdown: `### Learning Objectives\n- Analyze corporate earnings releases of high-beta megacap index constituents.\n- Utilize real-time squawk services, financial newsfeeds, and Twitter/X sentiment filters.\n- Complete and submit Unit 6 Comprehensive Macro & Micro Economic Analysis Assessment.`,
        learningObjectives: ['Analyze earnings beat/miss reactions', 'Incorporate fast newsfeeds in trade workflow', 'Pass Unit 6 Assessment'],
        practicalLabTask: 'Complete and submit the Unit 6 Macro and Micro Economic Assessment document.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      }
    ]
  },

  // ==========================================
  // MODULE 8: WEEK 8
  // ==========================================
  {
    id: 'mod-dft-08',
    courseTitle: 'Diploma in Financial Trading',
    title: 'Module 8 (Week 8): Technical Analysis Core & Japanese Candlesticks',
    description: 'Master price action dynamics, market auction theory, Japanese candlestick reading, and support & resistance engineering (Unit 7 Part 1).',
    order: 8,
    durationTrack: '90-Day Diploma',
    durationDays: 90,
    nsqfLevel: 'VTCT Level 5 Advanced Diploma',
    nitdaStandardCode: 'VTCT-DFT-MOD-08',
    theoryHours: 7.5,
    practicalHours: 15,
    learningGuideline: {
      prerequisites: ['Modules 1-7 completed', 'Proficiency with TradingView charts'],
      competencyOutcome: 'Read raw market price action, identify institutional supply and demand zones, and capitalize on high-probability support/resistance bounces.',
      expectedDeliverables: [
        '10 Multi-Timeframe Chart Markups Demonstrating S&R and Candlestick Confirmations',
        'Trade Journal Entries #16 to #18'
      ],
      dayRange: 'Days 50 - 56 (Week 8)',
      theoryHours: 7.5,
      practicalHours: 15
    },
    lessons: [
      {
        id: 'les-dft-8-1',
        moduleId: 'mod-dft-08',
        title: 'Technical Analysis Foundations, Market Auction Theory & Leading Indicators',
        durationMinutes: 55,
        type: 'video',
        dayNumber: 50,
        videoUrl: 'https://www.youtube.com/embed/0tL-K1L1Y_o',
        contentMarkdown: `### Learning Objectives\n- Understand market auction theory (value area, volume profile, point of control).\n- Differentiate lagging technical indicators from leading price action signals.\n- Establish multi-timeframe analysis hierarchy (Weekly/Daily bias -> H1/M15 execution).`,
        learningObjectives: ['Deconstruct market auction theory', 'Establish multi-timeframe chart workflow', 'Identify institutional order blocks'],
        practicalLabTask: 'Mark up higher timeframe institutional value areas across EUR/USD and Gold.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-8-2',
        moduleId: 'mod-dft-08',
        title: 'Japanese Candlestick Anatomy: Pinbars, Engulfing & Exhaustion Candles',
        durationMinutes: 65,
        type: 'video',
        dayNumber: 52,
        videoUrl: 'https://www.youtube.com/embed/C3U1s9V6K9g',
        contentMarkdown: `### Learning Objectives\n- Master candlestick anatomy: real body, upper wick (rejection), lower wick (demand).\n- Identify high-probability single-candle signals: Hammer, Shooting Star, Doji.\n- Identify dual and triple-candle confirmation patterns: Bullish/Bearish Engulfing, Morning/Evening Star.`,
        learningObjectives: ['Identify true institutional rejection wicks', 'Filter out noisy mid-range candlestick patterns', 'Combine candlestick signals with key market zones'],
        practicalLabTask: 'Identify and screenshot 5 confirmed candlestick rejection setups on H4 charts.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-8-3',
        moduleId: 'mod-dft-08',
        title: 'Support and Resistance: Horizontal Levels, Flips & Dynamic Zones',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 53,
        videoUrl: 'https://www.youtube.com/embed/K4z-Q5m8Y7E',
        contentMarkdown: `### Learning Objectives\n- Identify significant swing highs and swing lows across daily and 4-hour charts.\n- Understand support-resistance polarity flips (old support becomes new resistance).\n- Quantify zone confluence with psychological round numbers and previous week highs/lows.`,
        learningObjectives: ['Map institutional support/resistance levels', 'Trade support-turned-resistance retests', 'Identify liquidity pools above clean highs'],
        practicalLabTask: 'Map out major support and resistance zones on the S&P 500 Daily chart.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-8-4',
        moduleId: 'mod-dft-08',
        title: 'Breakouts vs Fakeouts & Trends, Channels and Portfolio Boost',
        durationMinutes: 65,
        type: 'lab',
        dayNumber: 56,
        videoUrl: 'https://www.youtube.com/embed/3vM_0K8vL6A',
        contentMarkdown: `### Learning Objectives\n- Distinguish legitimate volume-backed breakouts from false breakouts (liquidity sweeps).\n- Draw and trade ascending/descending regression channels and parallel trendlines.\n- Document trade entries with before/after chart evidence for portfolio boost.`,
        learningObjectives: ['Trade breakout retest confirmation', 'Avoid false breakout traps', 'Enhance portfolio entries with trend analysis'],
        practicalLabTask: 'Complete 2 demo breakout retest trade entries and log in your trading journal.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      }
    ]
  },

  // ==========================================
  // MODULE 9: WEEK 9
  // ==========================================
  {
    id: 'mod-dft-09',
    courseTitle: 'Diploma in Financial Trading',
    title: 'Module 9 (Week 9): Classical Chart Patterns & Market Geometry',
    description: 'Master geometric chart pattern recognition, continuation structures, reversal strategies, and measured move projections (Unit 7 Part 2).',
    order: 9,
    durationTrack: '90-Day Diploma',
    durationDays: 90,
    nsqfLevel: 'VTCT Level 5 Advanced Diploma',
    nitdaStandardCode: 'VTCT-DFT-MOD-09',
    theoryHours: 7.5,
    practicalHours: 15,
    learningGuideline: {
      prerequisites: ['Module 8 completed', 'Understanding of trend structure and support/resistance'],
      competencyOutcome: 'Identify and trade classical chart patterns with defined stop losses, measured move take profit targets, and minimum 1:2 risk-to-reward ratios.',
      expectedDeliverables: [
        'Chart Pattern Atlas with 8 Verified Formations (Head & Shoulders, Wedges, Triangles)',
        'Trade Journal Entries #19 to #21'
      ],
      dayRange: 'Days 57 - 63 (Week 9)',
      theoryHours: 7.5,
      practicalHours: 15
    },
    lessons: [
      {
        id: 'les-dft-9-1',
        moduleId: 'mod-dft-09',
        title: 'Classical Chart Patterns Overview: Continuation vs Reversal Structures',
        durationMinutes: 55,
        type: 'video',
        dayNumber: 57,
        videoUrl: 'https://www.youtube.com/embed/8vM6n8_L1aU',
        contentMarkdown: `### Learning Objectives\n- Categorize chart patterns into trend continuation vs major market reversal setups.\n- Understand the psychology behind pattern development and retail liquidity concentration.\n- Calculate measured move target objectives based on pattern height.`,
        learningObjectives: ['Classify pattern continuation vs reversal', 'Calculate measured move projection targets', 'Identify false neckline breaks'],
        practicalLabTask: 'Find 3 historical examples of continuation vs reversal patterns on TradingView.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-9-2',
        moduleId: 'mod-dft-09',
        title: 'Head and Shoulders & Inverse Head and Shoulders Breakout Strategies',
        durationMinutes: 65,
        type: 'video',
        dayNumber: 59,
        videoUrl: 'https://www.youtube.com/embed/8vM6n8_L1aU',
        contentMarkdown: `### Learning Objectives\n- Deconstruct the mechanics of Head and Shoulders (Left shoulder, Head, Right shoulder, Neckline).\n- Differentiate horizontal vs sloping necklines and volume divergence during head formation.\n- Execute neckline breakdown and retest entries with asymmetric risk-to-reward.`,
        learningObjectives: ['Spot Head and Shoulders exhaustion', 'Execute neckline retest entries', 'Avoid premature entries before neckline break'],
        practicalLabTask: 'Document a completed Head and Shoulders or Inverse H&S trade setup on your demo platform.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-9-3',
        moduleId: 'mod-dft-09',
        title: 'Wedges, Triangles, Double Tops & Double Bottom Formations',
        durationMinutes: 65,
        type: 'video',
        dayNumber: 61,
        videoUrl: 'https://www.youtube.com/embed/8vM6n8_L1aU',
        contentMarkdown: `### Learning Objectives\n- Master Ascending and Descending Wedges as high-probability trend exhaustion setups.\n- Trade Symmetrical, Ascending, and Descending Triangles.\n- Trade Double Top ("M") and Double Bottom ("W") patterns with volume divergence.`,
        learningObjectives: ['Trade wedge reversals against prevailing trends', 'Identify triangle compression breakouts', 'Verify double bottom volume expansion'],
        practicalLabTask: 'Screenshot and annotate an Ascending Wedge breakdown and a Double Bottom reversal.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-9-4',
        moduleId: 'mod-dft-09',
        title: 'Point & Figure Charting Concepts, Rectangles & Consolidation Analysis',
        durationMinutes: 60,
        type: 'lab',
        dayNumber: 63,
        videoUrl: 'https://www.youtube.com/embed/8vM6n8_L1aU',
        contentMarkdown: `### Learning Objectives\n- Understand Point & Figure charting principles (box size, reversal amounts, pure price filtering).\n- Analyze rectangle trading ranges using Wyckoff accumulation and distribution principles.\n- Record and log Week 9 trade entries into portfolio master sheet.`,
        learningObjectives: ['Understand Point and Figure filtering', 'Analyze Wyckoff accumulation ranges', 'Update trade entries in portfolio'],
        practicalLabTask: 'Complete chart pattern entries in trading journal and submit for weekly review.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      }
    ]
  },

  // ==========================================
  // MODULE 10: WEEK 10
  // ==========================================
  {
    id: 'mod-dft-10',
    courseTitle: 'Diploma in Financial Trading',
    title: 'Module 10 (Week 10): Quantitative Indicators, Volatility & Institutional Order Flow (ICT)',
    description: 'Master quantitative indicators, RSI divergences, Bollinger Band squeezes, ICT Turtle Soup liquidity sweeps, and institutional month-end capital flows (Unit 7 Part 3).',
    order: 10,
    durationTrack: '90-Day Diploma',
    durationDays: 90,
    nsqfLevel: 'VTCT Level 5 Advanced Diploma',
    nitdaStandardCode: 'VTCT-DFT-MOD-10',
    theoryHours: 7.5,
    practicalHours: 15,
    learningGuideline: {
      prerequisites: ['Modules 1-9 completed', 'Solid price action and chart pattern foundation'],
      competencyOutcome: 'Synthesize price action with quantitative indicator signals, volatility expansions, and institutional Inner Circle Trader (ICT) liquidity mechanics.',
      expectedDeliverables: [
        'ICT Turtle Soup Strategy Blueprint with 3 Annotated Trade Examples',
        'Trade Journal Entries #22 to #24'
      ],
      dayRange: 'Days 64 - 70 (Week 10)',
      theoryHours: 7.5,
      practicalHours: 15
    },
    lessons: [
      {
        id: 'les-dft-10-1',
        moduleId: 'mod-dft-10',
        title: 'Moving Averages: SMA vs EMA, Golden Cross, Death Cross & Dynamic S&R',
        durationMinutes: 55,
        type: 'video',
        dayNumber: 64,
        videoUrl: 'https://www.youtube.com/embed/9zY2_xL1V4U',
        contentMarkdown: `### Learning Objectives\n- Differentiate Simple Moving Averages (SMA) from Exponential Moving Averages (EMA).\n- Utilize 20 EMA, 50 SMA, and 200 SMA as institutional benchmark trend filters.\n- Trade the 50/200 Golden Cross and Death Cross; utilize moving averages as dynamic trailing stops.`,
        learningObjectives: ['Implement multi-MA trend filtering', 'Trade dynamic MA pullback retests', 'Avoid lagging indicator chop in rangebound markets'],
        practicalLabTask: 'Backtest a 20/50 EMA pullback strategy across 20 trades on the EUR/USD H1 chart.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-10-2',
        moduleId: 'mod-dft-10',
        title: 'RSI Divergences & Bollinger Bands Volatility Squeezes',
        durationMinutes: 65,
        type: 'video',
        dayNumber: 66,
        videoUrl: 'https://www.youtube.com/embed/1vL2_qM7N0s',
        contentMarkdown: `### Learning Objectives\n- Understand Relative Strength Index (RSI) momentum calculation.\n- Spot Regular (Reversal) and Hidden (Continuation) Bullish/Bearish Divergences.\n- Combine Bollinger Band contraction (Band Squeeze) with breakout volatility expansions.`,
        learningObjectives: ['Identify regular and hidden RSI divergences', 'Trade Bollinger Band squeezes', 'Combine momentum with support/resistance confluence'],
        practicalLabTask: 'Identify an RSI bullish or bearish divergence on an H4 chart and document the trade entry.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-10-3',
        moduleId: 'mod-dft-10',
        title: 'ICT (Inner Circle Trader) Concepts: "Turtle Soup" & Liquidity Sweeps',
        durationMinutes: 70,
        type: 'video',
        dayNumber: 68,
        videoUrl: 'https://www.youtube.com/embed/4yK_0n7M5jA',
        contentMarkdown: `### Learning Objectives\n- Understand institutional smart money concepts: Buy-Side Liquidity (BSL) and Sell-Side Liquidity (SSL).\n- Master the original Turtle Soup strategy (failing to sustain beyond 20-day high/low).\n- Identify Fair Value Gaps (FVG) and Market Structure Shifts (MSS) on lower timeframes.`,
        learningObjectives: ['Map out buy-side and sell-side liquidity pools', 'Execute Turtle Soup false-breakout reversals', 'Identify Fair Value Gaps for precise entries'],
        practicalLabTask: 'Chart an ICT Turtle Soup setup where price sweeps previous highs and reverses sharply.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-10-4',
        moduleId: 'mod-dft-10',
        title: 'Month-End & Month-Beginning Institutional Flows & Portfolio Boost',
        durationMinutes: 60,
        type: 'lab',
        dayNumber: 70,
        videoUrl: 'https://www.youtube.com/embed/5vM_8b1K9uE',
        contentMarkdown: `### Learning Objectives\n- Understand institutional rebalancing flows at month-end and quarter-end.\n- Analyze London fixing flows (4:00 PM London Fix) and foreign exchange rebalancing.\n- Complete Trade Entry #24 in your journal.`,
        learningObjectives: ['Analyze institutional month-end rebalancing', 'Navigate London Fix volatility', 'Audit journal entries before final capstone'],
        practicalLabTask: 'Document trade journal entry #24 with complete technical and macro rationale.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      }
    ]
  },

  // ==========================================
  // MODULE 11: WEEK 11
  // ==========================================
  {
    id: 'mod-dft-11',
    courseTitle: 'Diploma in Financial Trading',
    title: 'Module 11 (Week 11): Professional Trading Psychology & Behavioral Finance',
    description: 'Master psychological fortitude, cognitive biases, emotional regulation, and behavioral science to build professional trading discipline (Unit 8).',
    order: 11,
    durationTrack: '90-Day Diploma',
    durationDays: 90,
    nsqfLevel: 'VTCT Level 5 Advanced Diploma',
    nitdaStandardCode: 'VTCT-DFT-MOD-11',
    theoryHours: 8,
    practicalHours: 15,
    learningGuideline: {
      prerequisites: ['Modules 1-10 completed', 'Active trade journal with minimum 24 entries'],
      competencyOutcome: 'Identify and conquer destructive emotional trading impulses (revenge trading, FOMO, hesitation), and implement psychological protocols for peak mental execution.',
      expectedDeliverables: [
        'Personal Emotional Discipline & Psychological Self-Audit Document',
        'Unit 8 Trading Psychology Assessment Essay'
      ],
      dayRange: 'Days 71 - 77 (Week 11)',
      theoryHours: 8,
      practicalHours: 15
    },
    lessons: [
      {
        id: 'les-dft-11-1',
        moduleId: 'mod-dft-11',
        title: 'Trading Psychology: Controlling Emotions That Hold You Back or Cloud Judgement',
        durationMinutes: 65,
        type: 'video',
        dayNumber: 71,
        videoUrl: 'https://www.youtube.com/embed/1sK8vM_y9E0',
        contentMarkdown: `### Learning Objectives\n- Study Mark Douglas' "Trading in the Zone" core tenets (thinking in probabilities).\n- Neutralize the 4 primary trading fears: fear of losing, fear of missing out, fear of being wrong, fear of leaving money on the table.\n- Separate self-worth from trade outcome.`,
        learningObjectives: ['Deconstruct Mark Douglas probability thinking', 'Overcome loss aversion', 'Develop emotional detachment from trade outcomes'],
        practicalLabTask: 'Write a self-reflection on your single greatest psychological obstacle in trading.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-11-2',
        moduleId: 'mod-dft-11',
        title: 'Controlling Emotions That Entice You to Trade: Revenge Trading & Overtrading',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 73,
        videoUrl: 'https://www.youtube.com/embed/7uV2_q5M9aU',
        contentMarkdown: `### Learning Objectives\n- Understand the neurochemistry of trading (dopamine spikes during wins, cortisol during drawdowns).\n- Stop the revenge trading feedback loop following an unexpected loss.\n- Implement hard daily loss limits and "circuit breaker" rules to prevent account blowouts.`,
        learningObjectives: ['Recognize physical symptoms of tilt', 'Enforce daily maximum drawdown limits', 'Establish post-loss cooldown protocols'],
        practicalLabTask: 'Define your personal daily drawdown circuit breaker rule (e.g. stop trading for the day after 2 consecutive losses).',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-11-3',
        moduleId: 'mod-dft-11',
        title: 'Behavioral Science, Visualisation, Self-Talk & The Psychology of Optimism',
        durationMinutes: 60,
        type: 'video',
        dayNumber: 75,
        videoUrl: 'https://www.youtube.com/embed/1sK8vM_y9E0',
        contentMarkdown: `### Learning Objectives\n- Study Kahneman & Tversky's Prospect Theory (asymmetric pain of losses vs pleasure of gains).\n- Use positive visualization and pre-market rehearsal routines to prime flawless execution.\n- Replace toxic trader self-talk with objective statistical affirmations.`,
        learningObjectives: ['Apply Prospect Theory to risk management', 'Develop pre-market mental priming routine', 'Cultivate rational probabilistic optimism'],
        practicalLabTask: 'Create a 5-step pre-market psychological checklist to complete before opening your trading platform.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-11-4',
        moduleId: 'mod-dft-11',
        title: 'Common Trading Mistakes & Unit 8 Trading Psychology Assessment',
        durationMinutes: 70,
        type: 'reading',
        dayNumber: 77,
        videoUrl: 'https://www.youtube.com/embed/7uV2_q5M9aU',
        contentMarkdown: `### Learning Objectives\n- Review the top 10 retail trader blunders (moving stop losses, widening risk, premature profit taking).\n- Complete Unit 8 Trading Psychology Academic Assessment.\n- Milestone Gate: Submit Unit 8 essay for Program Officer audit.`,
        learningObjectives: ['Catalogue common trading errors', 'Complete Unit 8 Assessment', 'Undergo Program Officer Week 11 sign-off'],
        practicalLabTask: 'Complete and submit the Unit 8 Trading Psychology Assessment essay.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      }
    ]
  },

  // ==========================================
  // MODULE 12: WEEK 12
  // ==========================================
  {
    id: 'mod-dft-12',
    courseTitle: 'Diploma in Financial Trading',
    title: 'Module 12 (Week 12): Risk Governance, Trading Plan & Final Portfolio Capstone',
    description: 'Construct your comprehensive personal trading business plan, mathematical risk framework, and prepare final 25-trade portfolio submission for the VTCT assessment board (Unit 9 & Final Assessment).',
    order: 12,
    durationTrack: '90-Day Diploma',
    durationDays: 90,
    nsqfLevel: 'VTCT Level 5 Advanced Diploma',
    nitdaStandardCode: 'VTCT-DFT-MOD-12',
    theoryHours: 8,
    practicalHours: 15,
    learningGuideline: {
      prerequisites: ['Modules 1-11 completed', '25 verified trade journal entries completed'],
      competencyOutcome: 'Produce a comprehensive institutional trading business plan, demonstrate mathematically sound capital allocation, and achieve VTCT Level 5 Diploma qualification.',
      expectedDeliverables: [
        'Complete Written Personal Trading Business Plan (15-20 Pages)',
        'Final Combined Qualification Submission: 25 Portfolio Entries + Essays 1-15 + Trading Plan'
      ],
      dayRange: 'Days 78 - 90 (Week 12 / Final Capstone)',
      theoryHours: 8,
      practicalHours: 15
    },
    lessons: [
      {
        id: 'les-dft-12-1',
        moduleId: 'mod-dft-12',
        title: 'What is a Trading Plan? Core Architecture & Philosophy of a Trading Business',
        durationMinutes: 65,
        type: 'video',
        dayNumber: 79,
        videoUrl: 'https://www.youtube.com/embed/6vM1_xK8L9U',
        contentMarkdown: `### Learning Objectives\n- Treat financial trading as a rigorous operating business enterprise.\n- Define your trading philosophy, edge, market universe, and asset classes.\n- Establish operating hours, hardware/software infrastructure, and daily checklists.`,
        learningObjectives: ['Define your market edge and trading philosophy', 'Select core tradable asset universe', 'Establish operating protocols'],
        practicalLabTask: 'Draft Section 1 of your Personal Trading Plan (Mission Statement, Tradable Markets, and Operating Hours).',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-12-2',
        moduleId: 'mod-dft-12',
        title: 'Mathematical Risk Management: Fixed Fractional Sizing, 1% Rule & R-Multiples',
        durationMinutes: 65,
        type: 'video',
        dayNumber: 82,
        videoUrl: 'https://www.youtube.com/embed/2uL1_x9M5aU',
        contentMarkdown: `### Learning Objectives\n- Master fixed fractional position sizing (never risking more than 1% of account equity per trade).\n- Calculate position size formulas: Lot Size = (Account Equity * Risk %) / (Stop Loss in Pips * Pip Value).\n- Track performance in R-multiples rather than currency amounts.`,
        learningObjectives: ['Apply exact position sizing formulas', 'Structure asymmetric 1:2 and 1:3 R-multiples', 'Calculate expectancy and profit factor'],
        practicalLabTask: 'Embed a custom position sizing calculator into your trading plan.',
        submissionRequired: false,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-12-3',
        moduleId: 'mod-dft-12',
        title: 'Portfolio Review: Evidence of Trading Across Futures & Multi-Asset Classes',
        durationMinutes: 70,
        type: 'lab',
        dayNumber: 85,
        videoUrl: 'https://www.youtube.com/embed/3vM1_zK9L8U',
        contentMarkdown: `### Learning Objectives\n- Audit all 25 entries in your trading portfolio for compliance with VTCT Level 5 evidence standards.\n- Verify multi-asset diversity (Forex, Equities, Futures, Commodities, Crypto).\n- Ensure each trade has defined entry reason, chart markup, stop loss, take profit, outcome, and post-trade review.`,
        learningObjectives: ['Audit 25 trade portfolio entries', 'Verify multi-asset trading evidence', 'Calculate portfolio win-rate and profit factor'],
        practicalLabTask: 'Audit your complete 25-entry portfolio journal and compile performance metrics (Win Rate, Profit Factor, Average R-Multiple).',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      },
      {
        id: 'les-dft-12-4',
        moduleId: 'mod-dft-12',
        title: 'Final Assessment Capstone: Upload Combined Essays, Portfolio & Trading Plan',
        durationMinutes: 90,
        type: 'reading',
        dayNumber: 90,
        videoUrl: 'https://www.youtube.com/embed/6vM1_xK8L9U',
        contentMarkdown: `### Learning Objectives\n- Assemble final combined submission document: Essays 1-15 + 25 Portfolio Entries + Personal Trading Plan.\n- Submit final package to avik@educate2trade.com and bradley.goldberg@educate2trade.com with subject: "Final Submission - [Your Name]".\n- Program Officer final audit and submission to VTCT Level 5 assessment board for graduation certification.`,
        learningObjectives: ['Assemble final qualification submission document', 'Pass Program Officer final comprehensive audit', 'Earn VTCT Level 5 Advanced Diploma in Financial Trading'],
        practicalLabTask: 'Upload your finalized combined qualification portfolio document for Program Officer graduation certification.',
        submissionRequired: true,
        approvalStatus: 'Approved & Published'
      }
    ]
  }
];