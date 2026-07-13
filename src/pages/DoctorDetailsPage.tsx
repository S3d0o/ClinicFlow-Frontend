import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doctorsApi, reviewsApi } from '@/api';
import type { DoctorDetails as DoctorDetailsType, Review } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  MapPin,
  Briefcase,
  Banknote,
  Stethoscope,
  ArrowLeft,
  Calendar,
  MessageSquare,
} from 'lucide-react';

export function DoctorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [doctor, setDoctor] = useState<DoctorDetailsType | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    doctorsApi
      .getById(Number(id))
      .then((res) => setDoctor(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    reviewsApi
      .getDoctorReviews(Number(id), { pageNumber: 1, pageSize: 10 })
      .then((res) => setReviews(res.data))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50/40 to-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50/40 to-white">
        <div className="text-center">
          <Stethoscope className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-700">Doctor not found</h2>
          <Button asChild variant="link" className="mt-2">
            <Link to="/doctors">Back to doctors</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 to-white py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-6 text-slate-500 hover:text-teal-700"
          >
            <Link to="/doctors">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Doctors
            </Link>
          </Button>

          {/* Profile Card */}
          <Card className="mb-6 border-slate-100 shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-teal-500 to-teal-600" />
            <CardContent className="p-6 -mt-12">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="h-24 w-24 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl font-bold text-teal-600 border-4 border-white">
                  {doctor.fullName.charAt(0)}
                </div>
                <div className="flex-1 pt-2">
                  <h1 className="text-2xl font-bold text-slate-900">{doctor.fullName}</h1>
                  <p className="text-teal-600 font-medium">{doctor.specialtyName}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="font-medium text-slate-700">{doctor.averageRating.toFixed(1)}</span>
                      <span>({doctor.totalReviews} reviews)</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="text-2xl font-bold text-teal-700">{doctor.consultationFee} EGP</div>
                  <p className="text-xs text-slate-400">per consultation</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                  <Briefcase className="h-4 w-4 text-teal-600" />
                  <div>
                    <p className="text-xs text-slate-400">Experience</p>
                    <p className="text-sm font-medium text-slate-800">{doctor.yearsOfExperience} years</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  <div>
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-sm font-medium text-slate-800">{doctor.clinicCity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50">
                  <Banknote className="h-4 w-4 text-teal-600" />
                  <div>
                    <p className="text-xs text-slate-400">Consultation Fee</p>
                    <p className="text-sm font-medium text-slate-800">{doctor.consultationFee} EGP</p>
                  </div>
                </div>
              </div>

              {doctor.bio && (
                <div className="mt-5 p-4 rounded-xl bg-teal-50/50 border border-teal-100">
                  <p className="text-sm text-slate-600 leading-relaxed">{doctor.bio}</p>
                </div>
              )}

              {doctor.clinicAddress && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {doctor.clinicAddress}, {doctor.clinicCity}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                {isAuthenticated && role === 'Patient' ? (
                  <Button
                    onClick={() => navigate(`/patient/book/${doctor.id}`)}
                    className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-md shadow-teal-500/20"
                  >
                    <Calendar className="h-4 w-4 mr-2" /> Book Appointment
                  </Button>
                ) : !isAuthenticated ? (
                  <Button
                    onClick={() => navigate('/login')}
                    variant="outline"
                  >
                    <Calendar className="h-4 w-4 mr-2" /> Sign in to Book
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="reviews" className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Reviews
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5" /> Information
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="mt-4">
              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
                </div>
              ) : reviews.length === 0 ? (
                <Card className="border-slate-100">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No reviews yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="border-slate-100">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center text-xs font-semibold text-teal-600">
                                {review.patientName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">{review.patientName}</p>
                                <p className="text-xs text-slate-400">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <Star
                                  key={idx}
                                  className={`h-3.5 w-3.5 ${
                                    idx < review.rating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="info" className="mt-4">
              <Card className="border-slate-100">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Specialty</h3>
                    <p className="text-sm text-slate-600">{doctor.specialtyName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Years of Experience</h3>
                    <p className="text-sm text-slate-600">{doctor.yearsOfExperience} years</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Consultation Fee</h3>
                    <p className="text-sm text-slate-600">{doctor.consultationFee} EGP</p>
                  </div>
                  {doctor.clinicAddress && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1">Clinic Address</h3>
                      <p className="text-sm text-slate-600">{doctor.clinicAddress}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">City</h3>
                    <p className="text-sm text-slate-600">{doctor.clinicCity}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
