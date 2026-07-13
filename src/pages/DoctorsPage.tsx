import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doctorsApi, specialtiesApi } from '@/api';
import type { DoctorSummary, Specialty, DoctorSortBy } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Star,
  MapPin,
  Stethoscope,
  Briefcase,
  Banknote,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialtyId, setSpecialtyId] = useState<string>('all');
  const [city, setCity] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [name, setName] = useState('');
  const [sortBy, setSortBy] = useState<DoctorSortBy>('Rating');
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorsApi.list({
        ...(specialtyId !== 'all' ? { specialtyId: Number(specialtyId) } : {}),
        ...(city ? { city } : {}),
        ...(name ? { name } : {}),
        sortBy,
        pageNumber,
        pageSize: 12,
      });
      setDoctors(res.data);
      setHasMore(res.data.length === 12);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  }, [specialtyId, city, name, sortBy, pageNumber]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    specialtiesApi.getAll().then((res) => setSpecialties(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
  const timer = setTimeout(() => {
    setCity(cityInput);
    setPageNumber(1);
  }, 300);
  return () => clearTimeout(timer);
}, [cityInput]);

useEffect(() => {
  const timer = setTimeout(() => {
    setName(nameInput);
    setPageNumber(1);
  }, 300);
  return () => clearTimeout(timer);
}, [nameInput]);

  // const handleSearch = () => {
  //   setPageNumber(1);
  //   fetchDoctors();
  // };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Find a Doctor</h1>
            <p className="text-slate-500">Browse our network of verified healthcare professionals</p>
          </div>

          {/* Filters */}
          <Card className="mb-8 border-slate-100 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name..."
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setPageNumber(1)}
                    className="pl-10"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by city..."
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setPageNumber(1)}
                    className="pl-10"
                  />
                </div>
                <Select value={specialtyId} onValueChange={setSpecialtyId}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SlidersHorizontal className="h-4 w-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="All Specialties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    {specialties.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as DoctorSortBy)}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rating">Top Rated</SelectItem>
                    <SelectItem value="Fee">Lowest Fee</SelectItem>
                    <SelectItem value="Experience">Most Experienced</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setPageNumber(1)} className="bg-teal-600 hover:bg-teal-700">
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-16">
              <Stethoscope className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-1">No doctors found</h3>
              <p className="text-sm text-slate-400">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {doctors.map((doctor, i) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.35 }}
                  >
                    <Link to={`/doctors/${doctor.id}`}>
                      <Card className="h-full hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 group cursor-pointer border-slate-100">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-lg font-semibold shrink-0 group-hover:shadow-md group-hover:shadow-teal-500/20 transition-shadow">
                              {doctor.fullName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                                {doctor.fullName}
                              </h3>
                              <p className="text-sm text-teal-600 font-medium">{doctor.specialtyName}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                <span className="text-sm font-medium text-slate-700">{doctor.averageRating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{doctor.clinicCity}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-slate-500">
                                <Briefcase className="h-3.5 w-3.5" />
                                {doctor.yearsOfExperience}y
                              </span>
                              <span className="flex items-center gap-1 text-teal-700 font-medium">
                                <Banknote className="h-3.5 w-3.5" />
                                {doctor.consultationFee} EGP
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600">Page {pageNumber}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber((p) => p + 1)}
                  disabled={!hasMore}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
