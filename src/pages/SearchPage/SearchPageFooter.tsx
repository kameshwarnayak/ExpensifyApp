import React, {useState} from 'react';
import {View} from 'react-native';
import ReferralProgramCTA from '@components/ReferralProgramCTA';
import useThemeStyles from '@hooks/useThemeStyles';
import * as User from '@userActions/User';
import CONST from '@src/CONST';

function SearchPageFooter() {
    const [shouldShowReferralCTA, setShouldShowReferralCTA] = useState(true);
    const themeStyles = useThemeStyles();
    const referralType = CONST.REFERRAL_PROGRAM.CONTENT_TYPES.REFER_FRIEND;
    const dismissBanner = () => {
        setShouldShowReferralCTA(false);
        User.dismissReferralBanner(referralType);
    };

    return (
        <>
            {shouldShowReferralCTA && (
                <View style={[themeStyles.pb5, themeStyles.flexShrink0]}>
                    <ReferralProgramCTA
                        referralContentType={referralType}
                        onCloseButtonPress={dismissBanner}
                    />
                </View>
            )}
        </>
    );
}

SearchPageFooter.displayName = 'SearchPageFooter';

export default SearchPageFooter;
