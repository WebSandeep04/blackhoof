import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { createTestimonial, updateTestimonial, fetchTestimonials } from '../store/slices/testimonialsSlice';
import { ChevronLeft } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Swal from 'sweetalert2';

export default function TestimonialForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { testimonials } = useSelector((state) => state.testimonials);
    
    const [givenBy, setGivenBy] = useState('');
    const [text, setText] = useState('');
    const [rating, setRating] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            const testimonial = testimonials.find(t => t.id === parseInt(id));
            if (testimonial) {
                setGivenBy(testimonial.given_by);
                setText(testimonial.text);
                setRating(testimonial.rating);
            } else {
                dispatch(fetchTestimonials());
            }
        }
    }, [id, testimonials, dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!text || text === '<p><br></p>') {
            Swal.fire({
                title: 'Error!',
                text: 'Please write a testimonial text.',
                icon: 'error',
                confirmButtonColor: '#2bb69a'
            });
            return;
        }

        setIsSubmitting(true);

        const data = {
            given_by: givenBy,
            text: text,
            rating: rating
        };

        try {
            if (id) {
                await dispatch(updateTestimonial({ id, testimonialData: data })).unwrap();
            } else {
                await dispatch(createTestimonial(data)).unwrap();
            }
            
            Swal.fire({
                title: 'Success!',
                text: `Testimonial ${id ? 'updated' : 'created'} successfully.`,
                icon: 'success',
                confirmButtonColor: '#2bb69a',
                timer: 1500
            });
            navigate('/admin/testimonials');
        } catch (error) {
            Swal.fire({
                title: 'Error!',
                text: typeof error === 'string' ? error : 'There was an error saving the testimonial.',
                icon: 'error',
                confirmButtonColor: '#2bb69a'
            });
            setIsSubmitting(false);
        }
    };

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            ['clean']
        ],
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/admin/testimonials" className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit Testimonial' : 'Add Testimonial'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Given By (Name) *</label>
                    <input 
                        type="text" required
                        value={givenBy}
                        onChange={(e) => setGivenBy(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all font-medium"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                    <select 
                        required
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all"
                    >
                        {[5, 4, 3, 2, 1].map(r => (
                            <option key={r} value={r}>{r} Star{r !== 1 && 's'}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Testimonial Text *</label>
                    <div className="bg-white rounded-lg border overflow-hidden">
                        <ReactQuill 
                            theme="snow" 
                            value={text} 
                            onChange={setText} 
                            modules={modules}
                            className="h-64"
                            placeholder="Write the testimonial here..."
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-12">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-hover transition shadow-sm disabled:opacity-75 disabled:cursor-wait flex items-center justify-center gap-2"
                    >
                        {isSubmitting && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        {isSubmitting ? 'Saving...' : 'Save Testimonial'}
                    </button>
                </div>
            </form>
        </div>
    );
}
