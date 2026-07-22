import { Artisan, Review, TrustScoreHistory } from '@/types/artisan';
import { Bid } from '@/types/bidding';
import { Job } from '@/types/job';
import { Conversation, ChatMessage } from '@/types/message';
import { Plan } from '@/types/subscription';
import { Material, Supplier } from '@/types/marketplace';
import { AppNotification } from '@/types/notification';

export const mockArtisans: Artisan[] = [
  {
    id: 'a1',
    name: 'Kwame Mensah',
    phone: '+233241234567',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    coverUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
    profession: 'Master Plumber',
    trustScore: 96,
    rating: 4.9,
    reviewCount: 214,
    completedJobs: 341,
    yearsExperience: 9,
    distanceKm: 1.4,
    etaMinutes: 12,
    verified: true,
    badges: ['ID Verified', 'Background Checked', 'Top Rated'],
    responseRate: 98,
    languages: ['English', 'Twi'],
    skills: ['Pipe Fitting', 'Leak Detection', 'Water Heaters'],
    bio: 'Licensed plumber with 9 years of experience serving Accra and Tema. Specializes in emergency leak repair and full bathroom installs.',
    portfolio: [
      { id: 'p1', beforeUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600', afterUrl: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600', caption: 'Bathroom pipe replacement' },
    ],
    isOnline: true,
  },
  {
    id: 'a2',
    name: 'Ama Boateng',
    phone: '+233207654321',
    avatarUrl: 'https://i.pravatar.cc/150?img=32',
    coverUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800',
    profession: 'Electrical Engineer',
    trustScore: 92,
    rating: 4.8,
    reviewCount: 176,
    completedJobs: 260,
    yearsExperience: 7,
    distanceKm: 2.1,
    etaMinutes: 18,
    verified: true,
    badges: ['ID Verified', 'Licensed'],
    responseRate: 95,
    languages: ['English', 'Ga'],
    skills: ['Wiring', 'Solar Setup', 'Inverter Install'],
    bio: 'Certified electrician focused on safe residential and commercial wiring, solar backup systems and inverter installations.',
    portfolio: [
      { id: 'p2', beforeUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600', afterUrl: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=600', caption: 'Full home rewiring' },
    ],
    isOnline: true,
  },
  {
    id: 'a3',
    name: 'Yaw Owusu',
    phone: '+233551122334',
    avatarUrl: 'https://i.pravatar.cc/150?img=51',
    coverUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    profession: 'Furniture Carpenter',
    trustScore: 88,
    rating: 4.7,
    reviewCount: 98,
    completedJobs: 152,
    yearsExperience: 12,
    distanceKm: 3.6,
    etaMinutes: 25,
    verified: false,
    badges: ['Top Rated'],
    responseRate: 90,
    languages: ['English'],
    skills: ['Custom Furniture', 'Cabinetry', 'Repairs'],
    bio: 'Custom furniture and cabinetry specialist. Twelve years crafting bespoke pieces for homes across Kumasi.',
    portfolio: [
      { id: 'p3', beforeUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600', afterUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600', caption: 'Custom kitchen cabinets' },
    ],
    isOnline: false,
  },
];

export const mockReviews: Review[] = [
  { id: 'r1', artisanId: 'a1', customerName: 'Efua Adjei', customerAvatarUrl: 'https://i.pravatar.cc/150?img=5', rating: 5, comment: 'Kwame arrived early and fixed a leak I had struggled with for weeks. Professional and clean work.', createdAt: '2026-06-28', recommend: true },
  { id: 'r2', artisanId: 'a1', customerName: 'Nana Yeboah', customerAvatarUrl: 'https://i.pravatar.cc/150?img=8', rating: 5, comment: 'Excellent communication throughout and fair pricing.', createdAt: '2026-06-14', recommend: true },
  { id: 'r3', artisanId: 'a1', customerName: 'Kojo Antwi', customerAvatarUrl: 'https://i.pravatar.cc/150?img=15', rating: 4, comment: 'Good job overall, arrived slightly later than the ETA.', createdAt: '2026-05-30', recommend: true },
];

export const mockTrustHistory: TrustScoreHistory[] = [
  { month: 'Feb', score: 84 },
  { month: 'Mar', score: 87 },
  { month: 'Apr', score: 89 },
  { month: 'May', score: 91 },
  { month: 'Jun', score: 94 },
  { month: 'Jul', score: 96 },
];

export const mockBids: Bid[] = mockArtisans.map((artisan, index) => ({
  id: `bid-${index + 1}`,
  jobId: 'job-1',
  artisan,
  price: 250 + index * 80,
  estimatedDurationMinutes: 60 + index * 30,
  message: index === 0 ? "I can arrive within 15 minutes and have all the parts needed." : undefined,
  status: 'pending',
  createdAt: new Date().toISOString(),
}));

export const mockJob: Job = {
  id: 'job-1',
  categoryId: 'plumber',
  categoryName: 'Plumber',
  description: 'Kitchen sink pipe is leaking under the cabinet, water pooling on the floor.',
  photos: [],
  latitude: 5.6037,
  longitude: -0.187,
  address: 'East Legon, Accra',
  budgetMin: 200,
  budgetMax: 400,
  aiEstimatedPrice: 280,
  timing: 'today',
  status: 'bidding',
  createdAt: new Date().toISOString(),
};

export const mockConversations: Conversation[] = [
  { id: 'c1', participantName: 'Kwame Mensah', participantAvatarUrl: 'https://i.pravatar.cc/150?img=12', lastMessage: "I'm on my way, 12 mins out.", lastMessageAt: '09:41', unreadCount: 2, online: true },
  { id: 'c2', participantName: 'Ama Boateng', participantAvatarUrl: 'https://i.pravatar.cc/150?img=32', lastMessage: 'Thank you for the review!', lastMessageAt: 'Yesterday', unreadCount: 0, online: false },
];

export const mockMessages: ChatMessage[] = [
  { id: 'm1', conversationId: 'c1', sender: 'them', kind: 'text', content: 'Good morning! I accepted your job request.', createdAt: '09:12', read: true },
  { id: 'm2', conversationId: 'c1', sender: 'me', kind: 'text', content: 'Great, how soon can you get here?', createdAt: '09:14', read: true },
  { id: 'm3', conversationId: 'c1', sender: 'them', kind: 'text', content: "I'm on my way, 12 mins out.", createdAt: '09:41', read: false },
];

export const plans: Plan[] = [
  { id: 'free', name: 'Free', monthlyPrice: 0, yearlyPrice: 0, tagline: 'Get started with METIZO', features: ['Basic artisan access', 'Standard bidding', 'Basic support'] },
  { id: 'home_plus', name: 'Home+', monthlyPrice: 20, yearlyPrice: 200, tagline: 'For proactive homeowners', features: ['Priority booking', 'Lower service fees', 'Emergency priority', 'Free inspections', 'Exclusive discounts'], highlight: true },
  { id: 'home_pro', name: 'Home Pro', monthlyPrice: 50, yearlyPrice: 500, tagline: 'Complete home protection', features: ['Unlimited emergency requests', 'Annual inspections', 'Dedicated support', 'Premium artisans only', 'AI maintenance reminders', 'Extended warranty', 'Smart home reports', 'Priority bidding', 'Exclusive promotions'] },
  { id: 'business', name: 'Business', monthlyPrice: 0, yearlyPrice: 0, tagline: 'For hotels, schools, estates & facility managers', features: ['Dedicated account manager', 'Analytics dashboard', 'Bulk requests', 'Invoices', 'Team management'], customPricing: true },
];

export const mockMaterials: Material[] = [
  { id: 'mat1', name: 'Premium Emulsion Paint (20L)', category: 'Paint', price: 420, unit: 'bucket', imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400', supplierId: 's1', supplierName: 'BuildRight Supplies', rating: 4.6, inStock: true },
  { id: 'mat2', name: 'Ceramic Floor Tiles', category: 'Tiles', price: 35, unit: 'per m²', imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400', supplierId: 's1', supplierName: 'BuildRight Supplies', rating: 4.4, inStock: true },
  { id: 'mat3', name: 'PVC Pipe 4"', category: 'Pipes', price: 65, unit: 'per length', imageUrl: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400', supplierId: 's2', supplierName: 'Accra Hardware Hub', rating: 4.7, inStock: true },
  { id: 'mat4', name: 'Electrical Cable 2.5mm', category: 'Electrical', price: 18, unit: 'per meter', imageUrl: 'https://images.unsplash.com/photo-1621905251633-beddf70caebb?w=400', supplierId: 's2', supplierName: 'Accra Hardware Hub', rating: 4.5, inStock: false },
  { id: 'mat5', name: 'Weatherguard Exterior Paint (20L)', category: 'Paint', price: 480, unit: 'bucket', imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400', supplierId: 's3', supplierName: 'Kumasi Building Depot', rating: 4.5, inStock: true },
  { id: 'mat6', name: 'Wood Primer (5L)', category: 'Paint', price: 140, unit: 'can', imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400', supplierId: 's1', supplierName: 'BuildRight Supplies', rating: 4.3, inStock: true },
  { id: 'mat7', name: 'Porcelain Wall Tiles', category: 'Tiles', price: 42, unit: 'per m²', imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400', supplierId: 's3', supplierName: 'Kumasi Building Depot', rating: 4.6, inStock: true },
  { id: 'mat8', name: 'Non-Slip Bathroom Tiles', category: 'Tiles', price: 38, unit: 'per m²', imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400', supplierId: 's2', supplierName: 'Accra Hardware Hub', rating: 4.4, inStock: false },
  { id: 'mat9', name: 'PVC Pipe 2"', category: 'Pipes', price: 32, unit: 'per length', imageUrl: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400', supplierId: 's2', supplierName: 'Accra Hardware Hub', rating: 4.6, inStock: true },
  { id: 'mat10', name: 'Copper Pipe 15mm', category: 'Pipes', price: 95, unit: 'per length', imageUrl: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400', supplierId: 's3', supplierName: 'Kumasi Building Depot', rating: 4.8, inStock: true },
  { id: 'mat11', name: 'PPR Fittings Kit', category: 'Pipes', price: 55, unit: 'kit', imageUrl: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400', supplierId: 's1', supplierName: 'BuildRight Supplies', rating: 4.5, inStock: true },
  { id: 'mat12', name: 'Electrical Cable 4mm', category: 'Electrical', price: 26, unit: 'per meter', imageUrl: 'https://images.unsplash.com/photo-1621905251633-beddf70caebb?w=400', supplierId: 's3', supplierName: 'Kumasi Building Depot', rating: 4.6, inStock: true },
  { id: 'mat13', name: 'Circuit Breaker (30A)', category: 'Electrical', price: 75, unit: 'unit', imageUrl: 'https://images.unsplash.com/photo-1621905251633-beddf70caebb?w=400', supplierId: 's2', supplierName: 'Accra Hardware Hub', rating: 4.7, inStock: true },
  { id: 'mat14', name: 'LED Batten Light 20W', category: 'Electrical', price: 48, unit: 'unit', imageUrl: 'https://images.unsplash.com/photo-1621905251633-beddf70caebb?w=400', supplierId: 's1', supplierName: 'BuildRight Supplies', rating: 4.4, inStock: true },
  { id: 'mat15', name: 'Portland Cement (50kg)', category: 'Cement', price: 90, unit: 'bag', imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400', supplierId: 's3', supplierName: 'Kumasi Building Depot', rating: 4.5, inStock: true },
  { id: 'mat16', name: 'Ready-Mix Concrete Bag (25kg)', category: 'Cement', price: 55, unit: 'bag', imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400', supplierId: 's2', supplierName: 'Accra Hardware Hub', rating: 4.3, inStock: true },
  { id: 'mat17', name: 'Cordless Drill Set', category: 'Tools', price: 320, unit: 'set', imageUrl: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400', supplierId: 's1', supplierName: 'BuildRight Supplies', rating: 4.8, inStock: true },
  { id: 'mat18', name: 'Tool Belt & Pouch', category: 'Tools', price: 65, unit: 'unit', imageUrl: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400', supplierId: 's3', supplierName: 'Kumasi Building Depot', rating: 4.5, inStock: true },
];

export const mockSuppliers: Supplier[] = [
  { id: 's1', name: 'BuildRight Supplies', logoUrl: 'https://i.pravatar.cc/150?img=60', rating: 4.6, deliveryEtaDays: 2, location: 'Spintex, Accra' },
  { id: 's2', name: 'Accra Hardware Hub', logoUrl: 'https://i.pravatar.cc/150?img=61', rating: 4.5, deliveryEtaDays: 1, location: 'Osu, Accra' },
  { id: 's3', name: 'Kumasi Building Depot', logoUrl: 'https://i.pravatar.cc/150?img=62', rating: 4.7, deliveryEtaDays: 3, location: 'Adum, Kumasi' },
];

export const mockNotifications: AppNotification[] = [
  { id: 'n1', category: 'bid', title: 'New bid received', body: 'Kwame Mensah quoted GH₵250 for your plumbing job.', createdAt: '2 min ago', read: false },
  { id: 'n2', category: 'arrival', title: 'Artisan is arriving', body: 'Kwame is 12 minutes away.', createdAt: '10 min ago', read: false },
  { id: 'n3', category: 'payment', title: 'Payment secured', body: 'GH₵280 is held safely in escrow.', createdAt: '1 hr ago', read: true },
  { id: 'n4', category: 'job', title: 'Job completed', body: 'Ama Boateng marked your job as complete.', createdAt: 'Yesterday', read: true },
  { id: 'n5', category: 'promotion', title: 'Weekend discount', body: '15% off all emergency callouts this weekend.', createdAt: '2 days ago', read: true },
];
