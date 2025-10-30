import Menu from '../components/Menu';
import PostersDisplay from '../components/PostersDisplay';

export default function Home() {
  return (
    <div>
      <div className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-white py-16 animate-fade-in-up">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center mb-6">
            <img src="/logo.jpg" alt="Ice on Wheels Logo" className="w-20 h-20 rounded-full mr-4 animate-float" />
            <div>
              <h1 className="text-5xl font-bold mb-2 animate-bounce-in">
                Welcome to Ice on Wheels!
              </h1>
              <div className="text-4xl animate-bounce">🍨</div>
            </div>
          </div>
          <p className="text-xl max-w-2xl mx-auto animate-slide-in-left">
            Discover our delicious ice cream varieties. Customize your perfect scoop,
            add to cart, and enjoy sweet treats delivered fresh!
          </p>
        </div>
      </div>

      <PostersDisplay />

      <Menu />
    </div>
  );
}
