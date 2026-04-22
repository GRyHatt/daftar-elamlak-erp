import { useState } from 'react';
import { jsPDF } from "jspdf";
import { FileText, UploadCloud, X, Download, Image as ImageIcon, Settings, Layers } from 'lucide-react';

export default function DocumentMerger() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // دالة لاختيار الصور
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // فلترة عشان نتأكد إنها صور بس
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // تحويل الصور لروابط مؤقتة عشان نعرضها ونستخدمها
    const newImages = imageFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }));

    setImages(prev => [...prev, ...newImages]);
    e.target.value = ''; // تصفير الـ input
  };

  // دالة لحذف صورة من القائمة قبل الدمج
  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // 🚀 الدالة السحرية: دمج وضغط وتحويل لـ PDF
  const generatePDF = async () => {
    if (images.length === 0) return alert('برجاء اختيار صور أولاً');
    setLoading(true);

    try {
      // إنشاء ملف PDF جديد بحجم A4
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        // إضافة صفحة جديدة لكل صورة (ما عدا الصورة الأولى)
        if (i > 0) pdf.addPage();

        const img = new Image();
        img.src = images[i].url;
        
        // ننتظر لحد ما الصورة تحمل في الميموري
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        // حسبة ذكية عشان نظبط أبعاد الصورة على مقاس ورقة الـ A4 بدون ما تتمط
        const imgRatio = img.width / img.height;
        const pageRatio = pageWidth / pageHeight;
        
        let finalWidth = pageWidth;
        let finalHeight = finalWidth / imgRatio;

        if (finalHeight > pageHeight) {
          finalHeight = pageHeight;
          finalWidth = finalHeight * imgRatio;
        }

        // توسيط الصورة في الصفحة
        const xOffset = (pageWidth - finalWidth) / 2;
        const yOffset = (pageHeight - finalHeight) / 2;

        // إضافة الصورة للـ PDF (هنا بيحصل الضغط التلقائي بفضل خاصية FAST)
        pdf.addImage(img, 'JPEG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
      }

      // تحميل الملف النهائي
      pdf.save(`Document_Merged_${Date.now()}.pdf`);
      
      // تفريغ الأداة بعد النجاح
      setImages([]);
    } catch (error) {
      alert('حدث خطأ أثناء دمج المستندات: ' + error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* هيدر الصفحة */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-600/10 rounded-xl text-indigo-600"><Layers size={28} /></div>
        <h2 className="text-3xl font-bold text-slate-800">أداة دمج وضغط المستندات</h2>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
        
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-slate-700 mb-2">حول مجموعة صور لملف PDF واحد بضغطة زر</h3>
          <p className="text-slate-500 text-sm">مثالي لتجميع (صور البطاقة، الإيصالات، الشيكات) لرفعها في كشف حساب العميل</p>
        </div>

        {/* منطقة الرفع */}
        <div className="bg-slate-50 border-2 border-dashed border-indigo-200 rounded-2xl p-10 text-center hover:bg-indigo-50/50 transition-colors">
          <UploadCloud size={48} className="text-indigo-400 mx-auto mb-4" />
          <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold cursor-pointer transition-all shadow-md inline-block">
            اختر الصور للدمج
            <input type="file" multiple accept="image/jpeg, image/png, image/jpg" onChange={handleImageUpload} className="hidden" />
          </label>
          <p className="text-xs text-slate-400 mt-4 font-bold">يمكنك اختيار أكثر من صورة معاً (JPG, PNG)</p>
        </div>

        {/* عرض الصور المختارة */}
        {images.length > 0 && (
          <div className="mt-8">
            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2">
              <ImageIcon size={18} className="text-indigo-600"/> الصور المحددة ({images.length})
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {images.map((img, index) => (
                <div key={img.id} className="relative group bg-slate-100 rounded-xl p-2 border border-slate-200">
                  <span className="absolute -top-2 -right-2 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10">{index + 1}</span>
                  <button onClick={() => removeImage(img.id)} className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600">
                    <X size={14}/>
                  </button>
                  <div className="h-32 w-full rounded-lg overflow-hidden bg-white">
                    <img src={img.url} alt="preview" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-[10px] text-slate-500 text-center mt-2 truncate font-mono" dir="ltr">{img.file.name}</p>
                </div>
              ))}
            </div>

            {/* زرار الدمج */}
            <div className="flex justify-center border-t pt-6">
              <button 
                onClick={generatePDF} 
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black text-lg flex items-center gap-3 shadow-lg transition-all"
              >
                {loading ? <Settings className="animate-spin" size={24} /> : <Download size={24} />}
                {loading ? 'جاري الضغط والدمج...' : 'توليد وتحميل ملف الـ PDF النهائي'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}