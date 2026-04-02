export default function Footer() {
  return (
    <footer className="bg-qaa-navy-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-qaa-navy-800 rounded-lg flex items-center justify-center">
                <span className="text-qaa-gold-500 font-bold text-sm">Q</span>
              </div>
              <p className="text-white font-semibold text-sm">Qatar Aeronautical Academy</p>
            </div>
            <p className="text-sm leading-relaxed">
              The Gulf region&apos;s leading aviation training institution, providing
              world-class programs since 1977.
            </p>
          </div>

          {/* Programs */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Programs</h4>
            <ul className="space-y-2 text-sm">
              <li>Pilot Training (CPL/ATPL)</li>
              <li>Aircraft Maintenance Engineering</li>
              <li>Air Traffic Control</li>
              <li>Aviation Meteorology</li>
              <li>Airport Operations</li>
              <li>Flight Dispatch</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>P.O. Box 39, Doha, Qatar</li>
              <li>+974 4452 9000</li>
              <li>info@qaa.edu.qa</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-qaa-navy-800 text-center text-xs">
          &copy; {new Date().getFullYear()} Qatar Aeronautical Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
